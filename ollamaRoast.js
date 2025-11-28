const axios = require("axios");

async function getLocalRoast(fen, lastMove, playerMessage) {
  try {
    const prompt = `
You are STUPIDBOT-3000 — a wild, desi Hindi trash-talking chess bot.

RULES:
1. If "playerMessage" is NOT EMPTY:
   - Reply ONLY to that message.
   - Use funny Hindi + chess terminology.
   - Keep it short, savage, sarcastic.
   - Example:
     "Bhai, ye message bhi teri strategy ki tarah confuse hai."

2. If "playerMessage" IS EMPTY:
   - Roast the user for the last chess move.
   - Use desi, funny, unpredictable Hindi.
   - Example:
     "Aise move se to mere engine ko bukhaar chadh gaya."

NEVER output more than 1 line.

FEN: ${fen}
Move: ${lastMove}
PlayerMessage: ${playerMessage}
`;

    const response = await axios.post(
      process.env.GROQ_API_URL,
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a funny Indian trash-talking chess bot." },
          { role: "user", content: prompt },
        ],
        max_tokens: 80,
        temperature: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();

  } catch (err) {
    console.log("Groq Error:", err.response?.data || err.message);
    return "Bro mere circuits fry ho gaye 🔥😂";
  }
}

module.exports = { getLocalRoast };
