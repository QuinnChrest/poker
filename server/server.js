// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Console } = require("console");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

class PokerRoom {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.deck = [];
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.dealerPosition = 0;
  }

  generateDeck() {
    const suits = ["♠", "♥", "♦", "♣"];
    const values = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "T",
      "J",
      "Q",
      "K",
      "A",
    ];
    this.deck = suits.flatMap((suit) =>
      values.map((value) => ({ suit, value }))
    );
    this.shuffleDeck();
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealCards() {
    this.players.forEach((player) => {
      player.cards = [this.deck.pop(), this.deck.pop()];
    });
  }
}

io.on("connection", (socket) => {
  socket.on("createRoom", (name) => {
    const roomId = Math.random().toString(36).substr(2, 6);
    const room = new PokerRoom(roomId);
    room.players.push({ id: socket.id, name, chips: 1000, cards: [], bet: 0 });
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
    io.to(roomId).emit("updatePlayers", room.players);
    console.log(name + " created room " + roomId);
  });

  socket.on("joinRoom", ({ roomId, name }) => {
    const room = rooms.get(roomId);
    if (room && room.players.length < 9) {
      room.players.push({
        id: socket.id,
        name,
        chips: 1000,
        cards: [],
        bet: 0,
      });
      socket.join(roomId);
      io.to(roomId).emit("updatePlayers", room.players);
    } else {
      socket.emit("error", "Room full or invalid");
    }
  });

  socket.on("startGame", (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.generateDeck();
      room.dealCards();
      room.communityCards = [];
      room.pot = 0;
      io.to(roomId).emit("gameStarted", {
        players: room.players.map((p) => ({ ...p, cards: p.cards })),
        communityCards: room.communityCards,
        pot: room.pot,
      });
    }
  });

  socket.on("playerAction", ({ roomId, action, amount }) => {
    const room = rooms.get(roomId);
    // Handle bet/fold/check logic here
    io.to(roomId).emit("gameUpdate", room);
  });

  socket.on("disconnect", () => {
    // Handle player disconnection
  });
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
