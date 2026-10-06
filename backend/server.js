require("dotenv").config({
  path: __dirname + "/.env",
});

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());

// ==============================
// CORS
// ==============================

const allowedOrigins = [
  "https://smartyhood-frontend.onrender.com",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ==============================
// MONGODB
// ==============================

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) =>
    console.error("MongoDB connection error:", err)
  );

// ==============================
// HTTP SERVER
// ==============================

const server = http.createServer(app);

// ==============================
// SOCKET.IO
// ==============================

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },

  // 50 MB maximum Socket.IO message
  maxHttpBufferSize: 50 * 1024 * 1024,
});

// ============================================================
// PUBLIC CHAT CONFIGURATION
// ============================================================

const PUBLIC_CHAT_ROOM = "neet-general";
const MAX_PUBLIC_CHAT_USERS = 3;

// Currently connected public-chat users.
// Map: socket.id -> user information
const publicChatUsers = new Map();

// ============================================================
// PRIVATE CALLS
// ============================================================

const activeCalls = new Map();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Assigns the lowest available user number (1, 2, or 3).
// If a user leaves, their number is recycled for the next user.
function getAvailableUserNumber() {
  const usedNumbers = new Set(
    Array.from(publicChatUsers.values()).map((user) => user.userNumber)
  );

  for (let i = 1; i <= MAX_PUBLIC_CHAT_USERS; i++) {
    if (!usedNumbers.has(i)) {
      return i;
    }
  }

  return null;
}

function getPublicChatUsers() {
  return Array.from(publicChatUsers.values())
    .map((user) => ({
      userId: user.userId,
      userNumber: user.userNumber,
      socketId: user.socketId,
      joinedAt: user.joinedAt,
    }))
    .sort((a, b) => a.userNumber - b.userNumber);
}

function getUserBySocketId(socketId) {
  return publicChatUsers.get(socketId);
}

// Remove entries whose socket is no longer actually connected
// (ghost slots from dropped connections), so they can't hold a seat.
function purgeGhostUsers() {
  for (const socketId of publicChatUsers.keys()) {
    const s = io.sockets.sockets.get(socketId);
    if (!s || !s.connected) {
      console.log("Purged ghost public-chat user:", socketId);
      publicChatUsers.delete(socketId);
    }
  }
}

// End every private call that involves this socket.
function cleanupCallsForSocket(socketId) {
  for (const [callId, call] of activeCalls.entries()) {
    if (
      call.callerSocketId === socketId ||
      call.receiverSocketId === socketId
    ) {
      const otherSocket =
        call.callerSocketId === socketId
          ? call.receiverSocketId
          : call.callerSocketId;

      io.to(otherSocket).emit("call_ended", { callId });
      activeCalls.delete(callId);
    }
  }
}

// ============================================================
// SOCKET CONNECTION
// ============================================================

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Check availability without joining
  socket.on("check_chat_availability", () => {
    purgeGhostUsers();
    const isFull = publicChatUsers.size >= MAX_PUBLIC_CHAT_USERS;
    socket.emit("chat_availability", {
      available: !isFull,
      canJoin: !isFull,
      maxUsers: MAX_PUBLIC_CHAT_USERS,
      onlineUsers: publicChatUsers.size,
    });
  });

  // ==========================================================
  // JOIN PUBLIC CHAT
  // ==========================================================

  socket.on("join_room", (room) => {
    if (room !== PUBLIC_CHAT_ROOM) {
      console.log("Rejected unknown room:", room);
      socket.emit("chat_unavailable", {
        message: "Invalid chat room",
        maxUsers: MAX_PUBLIC_CHAT_USERS,
        onlineUsers: publicChatUsers.size,
      });
      return;
    }

    // Prevent duplicate join
    if (publicChatUsers.has(socket.id)) {
      const existingUser = publicChatUsers.get(socket.id);

      socket.emit("your_identity", {
        userId: existingUser.userId,
        userNumber: existingUser.userNumber,
        displayName: `User ${existingUser.userNumber}`,
      });

      return;
    }

    // Drop dead sockets so they can't occupy a slot.
    purgeGhostUsers();

    // ========================================================
    // HARD MAXIMUM CHECK & SLOT ASSIGNMENT (server-side)
    // Strictly max 3 users limit. Slots are always 1, 2, or 3.
    // Early joiners get User 1, then User 2, then User 3.
    // When someone leaves, their slot number is freed and reused.
    // ========================================================

    const userNumber = getAvailableUserNumber();

    if (!userNumber || publicChatUsers.size >= MAX_PUBLIC_CHAT_USERS) {
      console.log(
        `Chat unavailable for ${socket.id}: limit reached (${publicChatUsers.size}/${MAX_PUBLIC_CHAT_USERS} users)`
      );

      socket.emit("chat_unavailable", {
        message: "Bot 🤖 AI Assistant is temporarily unavailable. Please try again later.",
        maxUsers: MAX_PUBLIC_CHAT_USERS,
        onlineUsers: publicChatUsers.size,
      });

      // Disconnect socket immediately so 4th user cannot join
      socket.disconnect(true);
      return;
    }

    // ========================================================
    // CREATE ANONYMOUS USER ID
    // ========================================================

    const userId =
      `usr_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    const user = {
      userId,
      userNumber,
      socketId: socket.id,
      joinedAt: new Date().toISOString(),
      room,
    };

    // Store server-side identity
    publicChatUsers.set(socket.id, user);

    // Join Socket.IO room
    socket.join(room);

    console.log(
      `User ${userNumber} joined ${room} (${publicChatUsers.size}/${MAX_PUBLIC_CHAT_USERS})`
    );

    // Tell user who they are
    socket.emit("your_identity", {
      userId,
      userNumber,
      displayName: `User ${userNumber}`,
    });

    // Send current user count
    io.to(room).emit("online_users", publicChatUsers.size);

    // Inform other users
    socket.to(room).emit("user_joined", {
      userId,
      userNumber,
      displayName: `User ${userNumber}`,
      joinedAt: user.joinedAt,
    });

    // Send user list
    io.to(room).emit("public_chat_users", getPublicChatUsers());
  });

  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

  socket.on("send_message", (data) => {
    const user = getUserBySocketId(socket.id);

    if (!user) {
      console.log(
        "Message rejected: user is not inside public chat"
      );
      return;
    }

    if (!data || data.room !== PUBLIC_CHAT_ROOM) {
      return;
    }

    // Never trust sender information coming from frontend.
    // The server decides who sent the message.

    const message = {
      id:
        data.id ||
        `${user.userId}-${Date.now()}-${Math.random()}`,

      room: PUBLIC_CHAT_ROOM,

      type: data.type || "text",

      message:
        typeof data.message === "string"
          ? data.message.trim()
          : "",

      mediaType: data.mediaType || null,

      mimeType: data.mimeType || null,

      file: data.file || null,

      // SERVER-CONTROLLED IDENTITY
      sender: socket.id,
      userId: user.userId,
      userNumber: user.userNumber,
      displayName: `User ${user.userNumber}`,

      timestamp: Date.now(),
    };

    console.log(
      `Message from User ${user.userNumber}:`,
      message.type
    );

    io.to(PUBLIC_CHAT_ROOM).emit("receive_message", message);
  });

  // ==========================================================
  // DELETE OWN MESSAGE
  // ==========================================================

  socket.on("delete_message", (data) => {
    const user = getUserBySocketId(socket.id);

    if (!user) {
      return;
    }

    if (!data || data.room !== PUBLIC_CHAT_ROOM) {
      return;
    }

    console.log(
      `User ${user.userNumber} requested message deletion:`,
      data.messageId
    );

    // Users can delete only their own messages.
    if (data.sender !== socket.id) {
      console.log(`Delete rejected for User ${user.userNumber}`);
      return;
    }

    io.to(PUBLIC_CHAT_ROOM).emit("message_deleted", {
      messageId: data.messageId,
      userId: user.userId,
      userNumber: user.userNumber,
      sender: socket.id,
    });
  });

  // ==========================================================
  // TYPING
  // ==========================================================

  socket.on("typing", (data) => {
    const user = getUserBySocketId(socket.id);

    if (!user) {
      return;
    }

    if (!data || data.room !== PUBLIC_CHAT_ROOM) {
      return;
    }

    socket.to(PUBLIC_CHAT_ROOM).emit("user_typing", {
      userNumber: user.userNumber,
    });
  });

  // ==========================================================
  // LEAVE PUBLIC CHAT
  // ==========================================================

  socket.on("leave_chat", (room) => {
    if (room !== PUBLIC_CHAT_ROOM) {
      return;
    }

    const user = getUserBySocketId(socket.id);

    if (!user) {
      return;
    }

    console.log(`User ${user.userNumber} left ${room}`);

    // Remove server-side user (frees the slot)
    publicChatUsers.delete(socket.id);

    // End any private call this user was in
    cleanupCallsForSocket(socket.id);

    // Leave Socket.IO room
    socket.leave(room);

    // One user leaving must not clear the chat for everyone.

    io.to(room).emit("user_left", {
      userId: user.userId,
      userNumber: user.userNumber,
    });

    io.to(room).emit("online_users", publicChatUsers.size);

    io.to(room).emit("public_chat_users", getPublicChatUsers());
  });

  // ==========================================================
  // PRIVATE CALLING SYSTEM
  // ==========================================================

  // ----------------------------------------------------------
  // CALL USER
  // ----------------------------------------------------------

  socket.on("call_user", (data) => {
    const caller = getUserBySocketId(socket.id);

    if (!caller) {
      console.log("Call rejected: caller is not in public chat");
      return;
    }

    if (!data || !data.targetUserId) {
      console.log("Call rejected: target user missing");
      return;
    }

    // Find the receiver using the SERVER'S user ID.
    const receiver = Array.from(publicChatUsers.values()).find(
      (user) => user.userId === data.targetUserId
    );

    if (!receiver) {
      console.log("Call rejected: target user is not online");
      return;
    }

    // Prevent calling yourself.
    if (receiver.socketId === socket.id) {
      return;
    }

    const callId =
      `call_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 12)}`;

    activeCalls.set(callId, {
      callerSocketId: socket.id,
      receiverSocketId: receiver.socketId,
    });

    console.log(
      `Private call: User ${caller.userNumber} -> User ${receiver.userNumber}`
    );

    // Only the selected receiver gets this event.
    io.to(receiver.socketId).emit("incoming_call", {
      callId,

      caller: {
        userId: caller.userId,
        userNumber: caller.userNumber,
        displayName: `User ${caller.userNumber}`,
      },
    });
  });

  // ----------------------------------------------------------
  // ACCEPT CALL
  // ----------------------------------------------------------

  socket.on("accept_call", (data) => {
    if (!data || !data.callId) {
      return;
    }

    const call = activeCalls.get(data.callId);

    if (!call) {
      return;
    }

    // Only the intended receiver can accept.
    if (call.receiverSocketId !== socket.id) {
      return;
    }

    io.to(call.callerSocketId).emit("call_accepted", {
      callId: data.callId,
    });

    console.log(`Call accepted: ${data.callId}`);
  });

  // ----------------------------------------------------------
  // REJECT CALL
  // ----------------------------------------------------------

  socket.on("reject_call", (data) => {
    if (!data || !data.callId) {
      return;
    }

    const call = activeCalls.get(data.callId);

    if (!call) {
      return;
    }

    if (
      socket.id !== call.callerSocketId &&
      socket.id !== call.receiverSocketId
    ) {
      return;
    }

    const otherSocket =
      socket.id === call.callerSocketId
        ? call.receiverSocketId
        : call.callerSocketId;

    io.to(otherSocket).emit("call_rejected", {
      callId: data.callId,
    });

    activeCalls.delete(data.callId);

    console.log(`Call rejected: ${data.callId}`);
  });

  // ----------------------------------------------------------
  // WEBRTC OFFER
  // ----------------------------------------------------------

  socket.on("webrtc_offer", (data) => {
    if (!data || !data.callId || !data.offer) {
      return;
    }

    const call = activeCalls.get(data.callId);

    if (!call) {
      return;
    }

    if (
      socket.id !== call.callerSocketId &&
      socket.id !== call.receiverSocketId
    ) {
      return;
    }

    const otherSocket =
      socket.id === call.callerSocketId
        ? call.receiverSocketId
        : call.callerSocketId;

    io.to(otherSocket).emit("webrtc_offer", {
      callId: data.callId,
      offer: data.offer,
    });
  });

  // ----------------------------------------------------------
  // WEBRTC ANSWER
  // ----------------------------------------------------------

  socket.on("webrtc_answer", (data) => {
    if (!data || !data.callId || !data.answer) {
      return;
    }

    const call = activeCalls.get(data.callId);

    if (!call) {
      return;
    }

    if (
      socket.id !== call.callerSocketId &&
      socket.id !== call.receiverSocketId
    ) {
      return;
    }

    const otherSocket =
      socket.id === call.callerSocketId
        ? call.receiverSocketId
        : call.callerSocketId;

    io.to(otherSocket).emit("webrtc_answer", {
      callId: data.callId,
      answer: data.answer,
    });
  });

  // ----------------------------------------------------------
  // WEBRTC ICE CANDIDATE
  // ----------------------------------------------------------

  socket.on("webrtc_ice_candidate", (data) => {
    if (!data || !data.callId || !data.candidate) {
      return;
    }

    const call = activeCalls.get(data.callId);

    if (!call) {
      return;
    }

    if (
      socket.id !== call.callerSocketId &&
      socket.id !== call.receiverSocketId
    ) {
      return;
    }

    const otherSocket =
      socket.id === call.callerSocketId
        ? call.receiverSocketId
        : call.callerSocketId;

    io.to(otherSocket).emit("webrtc_ice_candidate", {
      callId: data.callId,
      candidate: data.candidate,
    });
  });

  // ----------------------------------------------------------
  // END CALL
  // ----------------------------------------------------------

  socket.on("end_call", (data) => {
    if (!data || !data.callId) {
      return;
    }

    const call = activeCalls.get(data.callId);

    if (!call) {
      return;
    }

    if (
      socket.id !== call.callerSocketId &&
      socket.id !== call.receiverSocketId
    ) {
      return;
    }

    const otherSocket =
      socket.id === call.callerSocketId
        ? call.receiverSocketId
        : call.callerSocketId;

    io.to(otherSocket).emit("call_ended", {
      callId: data.callId,
    });

    activeCalls.delete(data.callId);

    console.log(`Call ended: ${data.callId}`);
  });

  // ==========================================================
  // DISCONNECT
  // ==========================================================

  socket.on("disconnect", (reason) => {
    // Always clean up calls, even if the socket was never in the chat.
    cleanupCallsForSocket(socket.id);

    const user = getUserBySocketId(socket.id);

    if (!user) {
      console.log("Socket disconnected:", socket.id, reason);
      return;
    }

    console.log(`User ${user.userNumber} disconnected:`, reason);

    // Frees the slot
    publicChatUsers.delete(socket.id);

    io.to(PUBLIC_CHAT_ROOM).emit("user_left", {
      userId: user.userId,
      userNumber: user.userNumber,
    });

    io.to(PUBLIC_CHAT_ROOM).emit(
      "online_users",
      publicChatUsers.size
    );

    io.to(PUBLIC_CHAT_ROOM).emit(
      "public_chat_users",
      getPublicChatUsers()
    );
  });
});

// ============================================================
// TEST ROUTE
// ============================================================

app.get("/", (req, res) => {
  res.send("SmartyHood Backend Running");
});

// ============================================================
// STATUS ROUTE
// ============================================================

app.get("/api/chat/status", (req, res) => {
  purgeGhostUsers();

  const isFull = publicChatUsers.size >= MAX_PUBLIC_CHAT_USERS;

  res.json({
    room: PUBLIC_CHAT_ROOM,
    maxUsers: MAX_PUBLIC_CHAT_USERS,
    onlineUsers: publicChatUsers.size,
    isFull,
    canJoin: !isFull,
    connectedSockets: io.engine.clientsCount,
    users: getPublicChatUsers(),
  });
});

app.get("/api/chat/can-join", (req, res) => {
  purgeGhostUsers();

  const isFull = publicChatUsers.size >= MAX_PUBLIC_CHAT_USERS;

  res.json({
    room: PUBLIC_CHAT_ROOM,
    canJoin: !isFull,
    isFull,
    maxUsers: MAX_PUBLIC_CHAT_USERS,
    onlineUsers: publicChatUsers.size,
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});