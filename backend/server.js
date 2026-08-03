const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// SOCKET CONNECTION
let onlineUsers = 0;
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  onlineUsers++;
io.emit("online_users", onlineUsers);

  socket.on("join_room", (room) => {
    socket.join(room);
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });
socket.on("typing", (data) => {
    socket.to(data.room).emit("user_typing");
  });
  socket.on("disconnect", () => {
  console.log("User disconnected");

  onlineUsers--;

  if (onlineUsers < 0) {
    onlineUsers = 0;
  }

  io.emit("online_users", onlineUsers);
});
});

app.get("/", (req, res) => {
  res.send("SmartyHood Backend Running");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});