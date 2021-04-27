const http = require('http').createServer(); // simple http server

const io = require('socket.io')(http, {
	cors: {
		origin: '*',
	}
});

const port = 5000

// handle clients
const clients = {};

const addClient = (socket) => {
	console.log("New client connected", socket.id);
	clients[socket.id] = socket;
};

const removeClient = (socket) => {
	console.log("Client disconnected", socket.id);
	delete clients[socket.id];
};

io.sockets.on("connection", (socket) => {
	let id = socket.id;
	
	addClient(socket);

	socket.on("disconnect", () => {
		removeClient(socket);
		socket.broadcast.emit("client-disconnect", id);
	});
});

// create and handle players
var players = {}, unmatched; // object to store the players

function joinGame(socket) {
	players[socket.id] = {
		opponent: unmatched, // set as unmatched
		symbol: 'X', // give the first player the X
		socket: socket,
	};
	
	if (unmatched) { // if P1 is unmatched, meaning he exists, give P2 O
		players[socket.id].symbol = "O";
		players[unmatched].opponent = socket.id;
		unmatched = null; // P1 no longer unmatched
	} else {
		unmatched = socket.id;
	}
}

function getOpponent(socket) {
	if (!players[socket.id].opponent) {
		return;
	}
	
	return players[players[socket.id].opponent].socket;
}

// main connection handler
io.on('connection', (socket) => {
	joinGame(socket); // make the player's client join the game
	
	if (getOpponent(socket)) { // once a second player has joined, begin a game
		socket.emit("game.begin", {
			symbol: players[socket.id].symbol
		});
	
		getOpponent(socket).emit("game.begin", {
			symbol: players[getOpponent(socket).id].symbol
		});
	}
	
	socket.on("make.move", (data) => {
		if (!getOpponent(socket)) {
			return;
		}
	
		socket.emit("move.made", data);
		getOpponent(socket).emit("move.made", data);
	});
	
	socket.on("disconnect", () => {
		if (getOpponent(socket)) {
			getOpponent(socket).emit("opponent.left");
		}
	});
})

http.listen(port, () => console.log(`Listening on port ${port}`));
