// App.js
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

function App() {
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);

  const createRoom = () => socket.emit("createRoom", name);
  const joinRoom = () => socket.emit("joinRoom", { roomId, name });
  const startGame = () => socket.emit("startGame", roomId);
  const leaveGame = () => {
    socket.emit("leaveGame", { roomId, name });
    setPlayers([]);
  };

  useEffect(() => {
    socket.on("updatePlayers", (players) => setPlayers(players));
    socket.on("gameStarted", (state) => setGameState(state));
    socket.on("gameUpdate", (state) => setGameState(state));
    socket.on("roomCreated", (room) => setRoomId(room));
  }, []);

  return (
    <div>
      {!gameState ? (
        <div>
          {players.length > 0 ? (
            <div>
              <h3>Room ID: {roomId}</h3>
              <h3>Players in room:</h3>
              {players.map((p) => (
                <div key={p.id}>{p.name}</div>
              ))}
              <button onClick={startGame}>Start Game</button>
              <button onClick={leaveGame}>Leave Game</button>
            </div>
          ) : (
            <div>
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <button disabled={!name} onClick={createRoom}>
                Create Room
              </button>
              <input
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />
              <button disabled={!roomId || !name} onClick={joinRoom}>
                Join Room
              </button>
            </div>
          )}
        </div>
      ) : (
        <GameTable gameState={gameState} socket={socket} roomId={roomId} />
      )}
    </div>
  );
}

function GameTable({ gameState, socket, roomId }) {
  const [action, setAction] = useState("");
  const [betAmount, setBetAmount] = useState(0);

  const handleAction = () => {
    socket.emit("playerAction", { roomId, action, amount: betAmount });
  };

  return (
    <div className="poker-table">
      <div className="community-cards">
        {gameState.communityCards.map((card, i) => (
          <Card key={i} card={card} />
        ))}
      </div>

      <div className="pot">Pot: ${gameState.pot}</div>

      <div className="players">
        {gameState.players.map((player, i) => (
          <Player key={i} player={player} />
        ))}
      </div>

      <div className="controls">
        <select value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="check">Check</option>
          <option value="bet">Bet</option>
          <option value="fold">Fold</option>
        </select>
        {action === "bet" && (
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
          />
        )}
        <button onClick={handleAction}>Confirm</button>
      </div>
    </div>
  );
}

function Player({ player }) {
  return (
    <div className="player">
      <h4>
        {player.name} (${player.chips})
      </h4>
      <div className="cards">
        {player.cards.map((card, i) => (
          <Card key={i} card={card} />
        ))}
      </div>
      <div>Bet: ${player.bet}</div>
    </div>
  );
}

function Card({ card }) {
  return <div className="card">{card ? `${card.value}${card.suit}` : "?"}</div>;
}

export default App;
