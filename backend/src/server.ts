import express from "express";
import cors from "cors";
import { Engine } from "node-uci";
import path from "path";
import os from "os";
import fs from "fs";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to get best move from Stockfish
app.post("/api/move", async (req, res) => {
  try {
    const { fen, depth = 15, skill = 10 } = req.body;

    if (!fen) {
      return res.status(400).json({ error: "FEN position is required" });
    }

    console.log(`Processing position: ${fen}`);
    console.log(`Depth: ${depth}, Skill: ${skill}`);

    // Use absolute path to the user's home directory
    const homeDir = os.homedir();
    const stockfishPath = path.join(
      homeDir,
      "Downloads/stockfish/stockfish-macos-m1-apple-silicon"
    );

    // Check if the file exists
    if (!fs.existsSync(stockfishPath)) {
      console.error(`Stockfish executable not found at: ${stockfishPath}`);
      return res.status(500).json({ error: "Stockfish executable not found" });
    }

    console.log(`Using Stockfish at: ${stockfishPath}`);

    const engine = new Engine(stockfishPath);

    await engine.init();
    await engine.setoption("Skill Level", skill);
    await engine.position(fen);

    console.log("Engine initialized, calculating best move...");
    const result = await engine.go({ depth });

    console.log(`Best move found: ${result.bestmove}`);
    await engine.quit();

    // Parse the move to get from/to squares
    const from = result.bestmove.substring(0, 2);
    const to = result.bestmove.substring(2, 4);
    const promotion =
      result.bestmove.length > 4 ? result.bestmove.substring(4) : undefined;

    res.json({
      bestMove: result.bestmove,
      from,
      to,
      promotion,
    });
  } catch (error) {
    console.error("Error processing move:", error);
    res.status(500).json({
      error: "Failed to process move",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Chess API is running" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
