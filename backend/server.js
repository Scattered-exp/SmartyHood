require("dotenv").config({ path: __dirname + "/.env" });


const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
})
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            message: "Invalid username or password"
        });
    }

    const token = jwt.sign(
        {
            username: username,
            role: "admin"
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
        message: "Login successful",
        user: {
            username: username,
            role: "admin"
        }
    });
});
const authenticate = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                authenticated: false
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            authenticated: false
        });
    }
};
app.get("/api/auth/me", authenticate, (req, res) => {
    res.json({
        authenticated: true,
        user: req.user
    });
});
app.post("/api/logout", (req, res) => {
    res.clearCookie("token");

    res.json({
        message: "Logged out successfully"
    });
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

app.get("/", (req, res) => {
  res.send("SmartyHood Backend Running");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});