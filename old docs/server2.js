const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public2'));

const users = {}; // socket.id -> { username, color }

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

io.on('connection', (socket) => {
    let hasUsername = false;

    // Send current users list immediately
    socket.emit('update users', Object.values(users));

    socket.on('set username', (newName) => {
        if (!newName) return;

        const existingUsernames = Object.values(users).map(u => u.username.toLowerCase());
        if (existingUsernames.includes(newName.toLowerCase())) {
            socket.emit('username exists');
            return;
        }

        const existingColors = Object.values(users).map(u => u.color);
        users[socket.id] = { username: newName, color: getRandomColor(existingColors) };
        hasUsername = true;

        // --- System message: user joined ---
        io.emit('system message', `${newName} has joined the chat`);

        io.emit('update users', Object.values(users));
        socket.emit('enable chat');
    });

    socket.on('chat message', (msg) => {
        if (!hasUsername) return;
        const user = users[socket.id];
        io.emit('chat message', { username: user.username, msg, color: user.color });
    });

    socket.on('disconnect', () => {
        if (hasUsername) {
            const username = users[socket.id].username;
            delete users[socket.id];

            // --- System message: user left ---
            io.emit('system message', `${username} has left the chat`);

            io.emit('update users', Object.values(users));
        }
    });
});

http.listen(4000, () => {
    console.log('Server running on http://localhost:4000');
});