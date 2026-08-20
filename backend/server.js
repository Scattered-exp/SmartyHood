require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();

app.use(express.json());

app.use(
    cors({
        origin: "https://smartyhood-frontend.onrender.com"
    })
);

// MongoDB Connection
mongoose
    .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000
    })
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

const server = http.createServer(app);

// Socket.io
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

        console.log("User joined room:", room);

        socket.join(room);
    });

    socket.on("send_message", (data) => {

        console.log("Message received:", data);

        io.to(data.room).emit("receive_message", data);
    });

    socket.on("typing", (data) => {

        console.log("User is typing in room:", data.room);

        socket.to(data.room).emit("user_typing");
    });

    socket.on("disconnect", () => {

        console.log("User disconnected:", socket.id);

        onlineUsers--;

        if (onlineUsers < 0) {
            onlineUsers = 0;
        }

        io.emit("online_users", onlineUsers);
    });
});

// Test route
app.get("/", (req, res) => {
    res.send("SmartyHood Backend Running");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});