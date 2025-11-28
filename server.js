require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");

const { getBestMove } = require("./engine");   // STOCKFISH ONLY
const { getLocalRoast } = require("./ollamaRoast");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) =>
  res.send("Stupid Chess backend is running…")
);

io.on("connection", (socket) => {
  console.log("client connected:", socket.id);

  let game = new Chess();

  socket.emit("game:init", { fen: game.fen() });

  socket.on("player:move", async ({ from, to, promotion }) => {
    try {
      const move = game.move({
        from,
        to,
        promotion: promotion || "q",
      });

      if (!move) {
        socket.emit("move:invalid");
        return;
      }

      socket.emit("move:made", {
        from,
        to,
        san: move.san,
        fen: game.fen(),
      });

      // GAME OVER?
      if (game.isGameOver()) {
        socket.emit("game:over", { result: "YOU WON", fen: game.fen() });
        return;
      }

      // ENGINE MOVE (STOCKFISH)
      const best = await getBestMove(game.fen(), 10); // depth 10 strong & fast
      //console.log("Best move from Stockfish:", from);

      if (best) {
        // Extract ONLY the move, example: "bestmove e7e5 ponder g1f3"
        const parts = best.trim().split(" ");

        let moveStr = null;

        // "bestmove e7e5"
        if (parts[0] === "bestmove" && parts[1]) {
          moveStr = parts[1]; // e7e5
        }

        if (!moveStr || moveStr.length < 4) {
          console.log("Invalid bestmove format:", best);
          return;
        }

        const botFrom = moveStr.slice(0, 2);
        const botTo = moveStr.slice(2, 4);

        console.log("Bot playing:", botFrom, botTo);

        game.move({ from: botFrom, to: botTo, promotion: "q" });

        const botMoveVerbose = game.history({ verbose: true }).slice(-1)[0];

        socket.emit("bot:move", {
          from: botFrom,
          to: botTo,
          san: botMoveVerbose.san,
          fen: game.fen(),
        });

        if (game.isGameOver()) {
          socket.emit("game:over", {
            result: "BOT WON",
            fen: game.fen(),
          });
          return;
        }
      }


      // TRASH TALK
      getLocalRoast(game.fen(), move.san, "funny")
        .then((text) => socket.emit("bot:roast", { text }))
        .catch(() => socket.emit("bot:roast", { text: "I forgot my roast 😂" }));

    } catch (err) {
      console.error(err);
    }
  });
  socket.on("chat:message", ({ text }) => {
    console.log("message received:", text);

    getLocalRoast(text)
      .then(reply => {
        socket.emit("bot:roast", { text: reply });
      })
      .catch(() => {
        socket.emit("bot:roast", { text: "My circuits lagged 💀" });
      });
  });


  socket.on("reset", () => {
    game = new Chess();
    socket.emit("game:init", { fen: game.fen() });
  });

  socket.on("disconnect", () =>
    console.log("client disconnected:", socket.id)
  );
});

server.listen(PORT, () => console.log("Server running on port", PORT));
