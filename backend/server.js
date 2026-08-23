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

app.use(
  cors({
    origin: "https://smartyhood-frontend.onrender.com",
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
    origin: "*",
    methods: ["GET", "POST"],
  },

  // Allows temporary photo/video messages.
  // 50 MB maximum per Socket.IO message.
  maxHttpBufferSize: 50 * 1024 * 1024,
});

// ==============================
// ONLINE USERS
// ==============================

let onlineUsers = 0;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  onlineUsers++;

  io.emit("online_users", onlineUsers);

  // ==============================
  // JOIN CHAT ROOM
  // ==============================

  socket.on("join_room", (room) => {
    console.log(
      `User ${socket.id} joined room: ${room}`
    );

    socket.join(room);
  });

  // ==============================
  // SEND MESSAGE
  // ==============================

  socket.on("send_message", (data) => {
    console.log(
      "Message received:",
      data.type,
      data.mediaType || ""
    );

    /*
      IMPORTANT:

      Nothing is saved to MongoDB.

      The message only lives temporarily
      inside the connected clients.
    */

    io.to(data.room).emit(
      "receive_message",
      data
    );
  });

  // ==============================
  // TYPING
  // ==============================

  socket.on("typing", (data) => {
    socket
      .to(data.room)
      .emit("user_typing");
  });

  // ==============================
  // CLEAR CHAT
  // ==============================

  socket.on("leave_chat", (room) => {
    console.log(
      `User ${socket.id} left chat: ${room}`
    );

    /*
      Clear the temporary chat for everyone
      currently connected to the room.
    */

    io.to(room).emit("clear_chat");

    socket.leave(room);
  });

  // ==============================
  // DISCONNECT
  // ==============================

  socket.on("disconnect", () => {
    console.log(
      "User disconnected:",
      socket.id
    );

    onlineUsers--;

    if (onlineUsers < 0) {
      onlineUsers = 0;
    }

    io.emit(
      "online_users",
      onlineUsers
    );
  });
});

// ==============================
// TEST ROUTE
// ==============================

app.get("/", (req, res) => {
  res.send("SmartyHood Backend Running");
});

// ==============================
// START SERVER
// ==============================

const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});