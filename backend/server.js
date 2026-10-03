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

// Every user gets:
// - internal anonymous ID
// - display number
// - socket ID
//
// Example:
//
// User 1
// User 2
// User 3
//
// The display number is NOT the real identity of the person.

// Never reuse a number during the server lifetime.
let nextUserNumber = 1;

// Store currently connected public-chat users.
//
// Map:
// socket.id -> user information
//
const publicChatUsers = new Map();

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getPublicChatUsers() {
  return Array.from(publicChatUsers.values()).map((user) => ({
    userId: user.userId,
    userNumber: user.userNumber,
    socketId: user.socketId,
    joinedAt: user.joinedAt,
  }));
}

function getUserBySocketId(socketId) {
  return publicChatUsers.get(socketId);
}

// ============================================================
// SOCKET CONNECTION
// ============================================================

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // ==========================================================
  // JOIN PUBLIC CHAT
  // ==========================================================

  socket.on("join_room", (room) => {
    if (room !== PUBLIC_CHAT_ROOM) {
      console.log("Rejected unknown room:", room);
      return;
    }

    // Prevent duplicate join
    if (publicChatUsers.has(socket.id)) {
      console.log(
        `Socket ${socket.id} already joined public chat`
      );

      const existingUser = publicChatUsers.get(socket.id);

      socket.emit("your_identity", {
        userId: existingUser.userId,
        userNumber: existingUser.userNumber,
        displayName: `User ${existingUser.userNumber}`,
      });

      return;
    }

    // ========================================================
    // CREATE ANONYMOUS USER ID
    // ========================================================

    const userId =
      `usr_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    const userNumber = nextUserNumber++;

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
      `User ${userNumber} joined ${room}`
    );

    // ========================================================
    // TELL USER WHO THEY ARE
    // ========================================================

    socket.emit("your_identity", {
      userId,
      userNumber,
      displayName: `User ${userNumber}`,
    });

    // ========================================================
    // SEND CURRENT USER COUNT
    // ========================================================

    io.to(room).emit(
      "online_users",
      publicChatUsers.size
    );

    // ========================================================
    // INFORM OTHER USERS
    // ========================================================

    socket.to(room).emit("user_joined", {
      userId,
      userNumber,
      displayName: `User ${userNumber}`,
      joinedAt: user.joinedAt,
    });

    // ========================================================
    // SEND USER LIST
    // ========================================================

    io.to(room).emit(
      "public_chat_users",
      getPublicChatUsers()
    );
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

    // IMPORTANT:
    // Never trust sender information coming from frontend.
    //
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

    io.to(PUBLIC_CHAT_ROOM).emit(
      "receive_message",
      message
    );
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

    // For now, users can delete only their own messages.
    //
    // ADMIN deletion will be added later and will have
    // separate server-side authorization.

    if (data.sender !== socket.id) {
      console.log(
        `Delete rejected for User ${user.userNumber}`
      );

      return;
    }

    io.to(PUBLIC_CHAT_ROOM).emit(
      "message_deleted",
      {
        messageId: data.messageId,

        userId: user.userId,

        userNumber: user.userNumber,

        sender: socket.id,
      }
    );
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

    socket.to(PUBLIC_CHAT_ROOM).emit(
      "user_typing",
      {
        userNumber: user.userNumber,
      }
    );
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

    console.log(
      `User ${user.userNumber} left ${room}`
    );

    // Remove server-side user
    publicChatUsers.delete(socket.id);

    // Leave Socket.IO room
    socket.leave(room);

    // IMPORTANT:
    //
    // DO NOT clear the chat for everyone.
    //
    // One user leaving must not delete everyone's messages.

    io.to(room).emit(
      "user_left",
      {
        userId: user.userId,
        userNumber: user.userNumber,
      }
    );

    io.to(room).emit(
      "online_users",
      publicChatUsers.size
    );

    io.to(room).emit(
      "public_chat_users",
      getPublicChatUsers()
    );
  });

  // ==========================================================
  // DISCONNECT
  // ==========================================================

  socket.on("disconnect", (reason) => {
    const user = getUserBySocketId(socket.id);

    if (!user) {
      console.log(
        "Socket disconnected:",
        socket.id,
        reason
      );

      return;
    }

    console.log(
      `User ${user.userNumber} disconnected:`,
      reason
    );

    publicChatUsers.delete(socket.id);

    io.to(PUBLIC_CHAT_ROOM).emit(
      "user_left",
      {
        userId: user.userId,
        userNumber: user.userNumber,
      }
    );

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
// ADMIN TEST ROUTE
// ============================================================

app.get("/api/chat/status", (req, res) => {
  res.json({
    room: PUBLIC_CHAT_ROOM,
    onlineUsers: publicChatUsers.size,
    users: getPublicChatUsers(),
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});