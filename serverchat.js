const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const readline = require("readline");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
let user,pass;
app.use(express.json());
app.use(express.static("public2"));
const fs = require("fs");
//const express = require("express");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });
const users2 = {}; // socket.id -> { username, color }

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

// Serve static files
app.use(express.static("public2"));
app.use("/voices", express.static("uploads/voices"));
app.use("/videos", express.static("uploads/videos"));
// Multer config for voice upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/voices/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ".mp4")
});
//const upload = multer({ storage });

// Multer for images
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/images/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const uploadImage = multer({ 
    storage: imageStorage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new Error("Only images allowed"));
        }
        cb(null, true);
    }
});

// Multer for files
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/files/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const uploadFile = multer({ storage: fileStorage });

app.use("/images", express.static("uploads/images"));
app.use("/files", express.static("uploads/files"));

// Voice upload route
app.post("/upload-voice", upload.single("audio"), (req, res) => {
    const socketId = req.body.socketId;
    if (!req.file || !socketId || !users2[socketId]) return res.status(400).send("Invalid data");

    const user = users2[socketId];
    const audioURL = "/voices/" + req.file.filename;

    io.emit("voice message", {
        username: user.username,
        audio: audioURL,
        color: user.color
    });

    res.sendStatus(200);
});

// Upload image
app.post("/upload-image", uploadImage.single("image"), (req, res) => {
    const socketId = req.body.socketId;
    if (!req.file || !socketId || !users2[socketId]) return res.status(400).send("Invalid data");

    const user = users2[socketId];
    const imageURL = "/images/" + req.file.filename;

    io.emit("image message", {
        username: user.username,
        image: imageURL,
        color: user.color
    });

    res.sendStatus(200);
});

const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/videos/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});

const uploadVideo = multer({ 
    storage: videoStorage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("video/")) {
            return cb(new Error("Only videos allowed"));
        }
        cb(null, true);
    }
});

app.post("/upload-video", uploadVideo.single("video"), (req, res) => {
    const socketId = req.body.socketId;
    if (!req.file || !socketId || !users2[socketId]) return res.status(400).send("Invalid data");

    const user = users2[socketId];
    const videoURL = "/videos/" + req.file.filename;

    io.emit("video message", {
        username: user.username,
        video: videoURL,
        color: user.color
    });

    res.sendStatus(200);
});

// Upload generic file
/*app.post("/upload-file", uploadFile.single("file"), (req, res) => {
    const socketId = req.body.socketId;
    if (!req.file || !socketId || !users2[socketId]) return res.status(400).send("Invalid data");

    const user = users2[socketId];
    const fileURL = "/files/" + req.file.filename;
    const originalName = req.file.originalname;

    io.emit("file message", {
        username: user.username,
        file: fileURL,
        name: originalName,
        color: user.color
    });

    res.sendStatus(200);
});*/

// --- Socket.io connection ---
io.on("connection", (socket) => {
    let hasUsername = false;

    // Send current users list immediately
    socket.emit("update users", Object.values(users2));

    // --- Set username ---
    socket.on("set username", (newName) => {
        if (!newName) return;

        const name = newName.trim().toLowerCase();

        // 🔥 اقرأ users.txt كل مرة يحاول أحد التسجيل
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

    // --- Chat messages ---
    socket.on("chat message", (msg) => {
        if (!hasUsername) return;
        const user = users2[socket.id];
        io.emit("chat message", { username: user.username, msg, color: user.color });
    });

    // --- Disconnect ---
    socket.on("disconnect", () => {
        if (hasUsername) {
            const username = users2[socket.id].username;
            delete users2[socket.id];
            io.emit("system message", `${username} has left the chat`);
            io.emit("update users", Object.values(users2));
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
