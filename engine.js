const axios = require("axios");

async function getBestMove(fen) {
  try {
    const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(fen)}&depth=15`;

    const res = await axios.get(url);

    if (res.data?.bestmove) {
      return res.data.bestmove;
    }

    return null;
  } catch (err) {
    console.log("Stockfish API error:", err.message);
    return null;
  }
}

module.exports = { getBestMove };
