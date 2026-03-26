
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const readline = require("readline");
let winprice=0;
const app = express();
const server = http.createServer(app);
const io = new Server(server);
let user;
app.use(express.json());
app.use(express.static("public"));
let ticket=0;
// In-memory storage
let users = [];    // {id, username}
let tickets = [];  // {userId, numbers}

// Generate 5 unique numbers
function generateNumbers() {
    let nums = [];
    while (nums.length < 3) {
        let n = Math.floor(Math.random() * 16) + 1;
        if (!nums.includes(n)) nums.push(n);
    }
	console.log("number of players is "+users.length);
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
    const { username } = req.body;
	    //const id = users.length + 1;
	const id =username;	
	user=id;
	//read the file to check if user exists
	
	//import * as fs from 'node:fs/promises';
//treating users in users1 file and add 1 to winprice

const fs = require('fs');
fs.readFile('users.txt', 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }

    const lines = data.split('\n').map(line => line.trim());

    if (lines.includes(id+" 1")&& !users.includes(id)) {
		//users.push(id);
    res.json({ userId: id, num:3 });
       // console.log("ID found in the file");
	   ticket=1;
		//winprice=winprice+1;
    } 
	else if (lines.includes(id+" 2")&& !users.includes(id)) {
		//users.push(id);
    res.json({ userId: id, num:4 });
       // console.log("ID found in the file");
		//winprice=winprice+2;
ticket=2;
    }
	else
		 if (lines.includes(id+" 3")&& !users.includes(id)) {
		//users.push(id);
    res.json({ userId: id, num:5 });
	ticket=3;
        //console.log("ID found in the file");
		//winprice=winprice+3;
    }
	else {
        //console.log("ID not found");
		res.json({ userId: null });
    }
});

});

// Submit ticket
app.post("/ticket", (req, res) => {
    const { userId, numbers } = req.body;
    tickets.push({ userId, numbers });
    res.json({ message: "Ticket submitted" });
	
	if(ticket==1)
winprice=winprice+1;
else if(ticket==2)
winprice=winprice+2;
else if(ticket==3)
winprice=winprice+3;
	users.push(userId);
	//console.log(users);
	//console.log("win price="+winprice);
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

function askForDraw() {
    rl.question("Generate numbers? (yes/no): ", (answer) => {
        if (answer.toLowerCase() === "yes") {
            const draw = generateNumbers();
            let results = [];
			winprice=winprice*0.9;
let winp=winprice;

            tickets.forEach(ticket => {
                const playerNumbers = ticket.numbers.map(Number);
                let matches = playerNumbers.filter(n => draw.includes(n)).length;
                let win = calculateWin(matches, winprice);
				win=win+" $";
			
                results.push({
                    userId: ticket.userId,
                    numbers: ticket.numbers,
                    matches,
                    win,
				winp:winprice					
	
                });
            });
            // Send results to all clients
            io.emit("result", { draw:draw.join(" "), results,winp });
			console.log("win price", winprice);
            console.log("Lotto numbers:", draw);

            // Clear tickets for next round
            tickets = [];
			winprice=0;
			//delete the content of the users file
			
		const fs = require('fs');

const filePath = 'users.txt'; // Replace with your file path

fs.writeFile(filePath, '', (err) => {
  if (err) {
    console.error('Error clearing the file:', err);
    return;
  }
  //console.log('File content has been cleared successfully.');
});
		
        } else {
            console.log("No draw executed");
        }

        // Ask again after previous answer
        askForDraw();
    });
}

// start asking when server starts
askForDraw();

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});