const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 🌟 Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware
app.use(express.json());
app.use(express.static("public2"));

// Multer for temporary file uploads
const upload = multer({ dest: "temp/" });

// Users storage
const users2 = {}; // socket.id -> { username, color }

// Utility: generate random color
function getRandomColor(existingColors = []) {
  let color;
  do {
    const r = Math.floor(Math.random() * 156 + 100);
    const g = Math.floor(Math.random() * 156 + 100);
    const b = Math.floor(Math.random() * 156 + 100);
    color = `rgb(${r},${g},${b})`;
  } while (existingColors.includes(color));
  return color;
}

// Helper: handle uploads
async function handleUpload(req, res, resourceType, socketEvent, fileField) {
  try {
    const socketId = req.body.socketId;
    if (!req.file || !socketId || !users2[socketId]) {
      return res.status(400).send("Invalid data");
    }

    const result = await cloudinary.uploader.upload(req.file.path, { resource_type: resourceType });
    fs.unlinkSync(req.file.path);

    const user = users2[socketId];
    io.emit(socketEvent, {
      username: user.username,
      [socketEvent.includes("voice") ? "audio" : socketEvent.includes("image") ? "image" : "video"]: result.secure_url,
      color: user.color
    });

    res.sendStatus(200);

  } catch (err) {
    console.error(err);
    res.status(500).send("Upload error");
  }
}

// Upload routes
app.post("/upload-voice", upload.single("audio"), (req, res) =>
  handleUpload(req, res, "video", "voice message", "audio")
);

app.post("/upload-image", upload.single("image"), (req, res) =>
  handleUpload(req, res, "image", "image message", "image")
);

app.post("/upload-video", upload.single("video"), (req, res) =>
  handleUpload(req, res, "video", "video message", "video")
);

// Socket.io
io.on("connection", (socket) => {
  let hasUsername = false;

  socket.emit("update users", Object.values(users2));

  socket.on("set username", (newName) => {
    if (!newName) return;

    const name = newName.trim().toLowerCase();

    fs.readFile("users.txt", "utf8", (err, data) => {
      if (err) {
        console.error("Error reading users.txt:", err);
        socket.emit("server error");
        return;
      }

      const usernamesArray = data
        .split("\n")
        .map(u => u.trim().toLowerCase())
        .filter(u => u);

      if (!usernamesArray.includes(name)) {
        socket.emit("username is not registered");
        return;
      }

      const existingUsernames = Object.values(users2).map(u => u.username.toLowerCase());
      if (existingUsernames.includes(name)) {
        socket.emit("username exists");
        return;
      }

      const existingColors = Object.values(users2).map(u => u.color);

      users2[socket.id] = {
        username: newName,
        color: getRandomColor(existingColors)
      };

      hasUsername = true;

      io.emit("system message", `${newName} has joined the chat`);
      io.emit("update users", Object.values(users2));
      socket.emit("enable chat");
    });
  });

  socket.on("chat message", (msg) => {
    if (!hasUsername) return;
    const user = users2[socket.id];
    io.emit("chat message", { username: user.username, msg, color: user.color });
  });

  socket.on("disconnect", () => {
    if (hasUsername) {
      const username = users2[socket.id].username;
      delete users2[socket.id];
      io.emit("system message", `${username} has left the chat`);
      io.emit("update users", Object.values(users2));
    }
  });
});

// Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));