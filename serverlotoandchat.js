const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const readline = require("readline");
let winprice=0;
let nbplayers=0;

let pointamount=0;
const app = express();
const server = http.createServer(app);
const io = new Server(server);


let user,pass;
app.use(express.json());
app.use(express.static("public"));
app.use('/chat', express.static('public2'));
let ticket=0;
// In-memory storage
let users = [];    // {id, username}
let tickets = [];  // {userId, numbers}
/*
var admin = require("firebase-admin");

var serviceAccount = require("serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


function sendNotification(token, message) {
  admin.messaging().send({
    token: token,
    notification: {
      title: "New Message 💬",
      body: message
    }
  });
}

socket.on("message", (data) => {
  if (!userOnline) {
    sendNotification(userToken, data.text);
  }
});*/

// Generate 5 unique numbers
function generateNumbers() {
    let nums = [];
    while (nums.length < 3) {
        let n = Math.floor(Math.random() * 16) + 1;
        if (!nums.includes(n)) nums.push(n);
    }
	console.log("number of players is "+nbplayers);
	users=[];
    return nums;
}
function roundTo(num, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}
// Calculate win
function calculateWin(matches, amount) {
	//console.log("win price="+winprice);
    if (matches === 1) return roundTo(amount * 0.2,1);
    if (matches === 2) return roundTo(amount * 0.3,1);
    if (matches === 3) return roundTo(amount * 0.5,1);
   // if (matches === 5) return amount * 0.45;
    return 0;
}

// Register player

app.post("/register", (req, res) => {
   // const { username, passwd } = req.body;
	const username=req.body.username;
	const pa=req.body.passwd;
	user=username;
	pass=pa;
	    //const id = users.length + 1;
	//const id =username;	
	//const p=pa;
	
	const mysql = require('mysql2');

// Database connection details
const connection = mysql.createConnection({
  host: 'localhost',      // Your MySQL host (e.g., '127.0.0.1')
  user: 'root',  // Your MySQL username (e.g., 'root')
  password: '', // Your MySQL password (can be empty)
  database: 'lotto' // Name of the database you want to use
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  //console.log('Connected to the database as id ' + connection.threadId);
});

// Execute the SELECT query
connection.query('SELECT * FROM users WHERE username = ? and password = ? and played="0"', [user,pass],function (error, results, fields) {
  if (error) {
    // Handle error (e.g., log it and return)
    console.error(error);
    return;
  }

  // Check the length of the results array
  if (results.length > 0) {
    // Rows were returned
	res.json({ userId: user, num:results[0].roundtype });
	ticket=results[0].roundtype -2;
   // console.log('User found:', results[0].username);
  } else {
	  res.json({ userId: null });
    // No rows were returned
   // console.log('No user found with the specified ID.');
  }
});

// Close the connection (optional, good practice for simple scripts)
connection.end((err) => {
  if (err) {
    console.error('Error closing the connection: ' + err.stack);
    return;
  }
  //console.log('Connection closed.');
});

});
//let num1=num2=num3=num4=0;
// Submit ticket
app.post("/ticket", (req, res) => {
    const { userId, numbers } = req.body;
	/*
	if(numbers.length==3){
	[num1,num2,num3]=numbers;
	num4=0;num5=0;
	}
	if(numbers.length==4){
	[num1,num2,num3,num4]=numbers;
	num5=0;
	}
	 if(numbers.length==5)
		 [num1,num2,num3,num4,num5]=numbers;*/
	//insert the selected numbers in the db
	/*
	const mysql2 = require('mysql2');

// Database connection details
const connection2 = mysql2.createConnection({
  host: 'localhost',      // Your MySQL host (e.g., '127.0.0.1')
  user: 'root',  // Your MySQL username (e.g., 'root')
  password: '', // Your MySQL password (can be empty)
  database: 'lotto' // Name of the database you want to use
});

// Connect to the database
connection2.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  //console.log('Connected to the database as id ' + connection.threadId);
});

// Execute the SELECT query
connection2.query('update users set nb1=?, nb2=?, nb3=?, nb4=?, nb5=?  WHERE username = ? and password = ? and played="0"', [num1,num2,num3,num4,num5,user,pass],function (error, results, fields) {
  if (error) {
    // Handle error (e.g., log it and return)
    console.error(error);
    return;
  }

});

// Close the connection (optional, good practice for simple scripts)
connection2.end((err) => {
  if (err) {
    console.error('Error closing the connection: ' + err.stack);
    return;
  }
  //console.log('Connection closed.');
});
	*/
	
	/////////////////////
    tickets.push({ userId, numbers });
    res.json({ message: "Ticket submitted" });
	nbplayers++;
	if(ticket==1)
winprice=winprice+1;
else if(ticket==2)
winprice=winprice+2;
else if(ticket==3)
winprice=winprice+3;

		const mysql = require('mysql2');

// Database connection details
const connection = mysql.createConnection({
  host: 'localhost',      // Your MySQL host (e.g., '127.0.0.1')
  user: 'root',  // Your MySQL username (e.g., 'root')
  password: '', // Your MySQL password (can be empty)
  database: 'lotto' // Name of the database you want to use
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }
  //console.log('Connected to the database as id ' + connection.threadId);
});

// Execute the SELECT query
connection.query('update users set played="1" WHERE username = ?', [user], function (error, results, fields) {
  if (error) {
    // Handle error (e.g., log it and return)
    console.error(error);
    return;
  }

  // Check the length of the results array
  
  
});

// Close the connection (optional, good practice for simple scripts)
connection.end((err) => {
  if (err) {
    console.error('Error closing the connection: ' + err.stack);
    return;
  }
  //console.log('Connection closed.');
});
});

// Socket.IO connection
io.on("connection", (socket) => {
    //console.log("A player connected");
	
});

// readline to ask server admin
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let totalmatches=0;
function askForDraw() {
    rl.question("Generate numbers? (yes/no): ", (answer) => {
        if (answer.toLowerCase() === "yes") {
            const draw = generateNumbers();
            let results = [];
			winprice=roundTo(winprice*0.8,1);
let winp=winprice;

            tickets.forEach(ticket => {
                const playerNumbers = ticket.numbers.map(Number);
                let matches=0;
				matches= playerNumbers.filter(n => draw.includes(n)).length;
                
				if(matches==1) matches=1;
				else if(matches==2) matches=8*matches;
				else if(matches==3) matches=200*matches;
				
				let win = calculateWin(matches, winprice);
				win=win+" $";
			totalmatches=totalmatches+matches;
                results.push({
                    userId: ticket.userId,
                    numbers: ticket.numbers,
                    matches,
                    win,
				winp:winprice					
                });
            });
if(totalmatches==0)
	pointamount=0;
else pointamount=roundTo(winprice/totalmatches,2);
            // Send results to all clients
            io.emit("result", { draw:draw.join(" "), results,winp,pointamount });
			console.log("win price", winprice);
			//if(totalmatches!=0)
			console.log("point amount", pointamount);
		
            console.log("Lotto numbers:", draw);

            // Clear tickets for next round
            tickets = [];
			winprice=0;
			totalmatches=0;
			//delete the content of the users file
	
nbplayers=0;
		
        } else {
            console.log("No draw executed");
        }

        // Ask again after previous answer
        askForDraw();
    });
}

// start asking when server starts
askForDraw();

//const express = require('express');
//const app = express();
//const http = require('http').createServer(app);
//const io = require('socket.io')(http);
//const express = require("express");
//const app = express();
//const http = require("http").createServer(app);
//const io = require("socket.io")(http);
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
const upload = multer({ storage });

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

//server.listen(3000, () => console.log("Server running on port 3000"));