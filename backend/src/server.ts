import express from "express";
import cors from "cors";
import { Engine } from "node-uci";
import path from "path";
import os from "os";
import fs from "fs";
import { ENV } from "./config/constants";
import connectDB from "./config/database";
import mongoose from "mongoose";

// Import routes
import gameRoutes from "./routes/gameRoutes";

// Import AI Manager
import AIManagerService from "./services/ai/AIManagerService";

// Initialize Express app
const app = express();
const PORT = ENV.PORT;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoints
app.use("/api/games", gameRoutes);

// API endpoint to get best move from Stockfish
app.post("/api/move", async (req, res) => {
  try {
    const {
      fen,
      depth = ENV.DEFAULT_DEPTH,
      skill = ENV.DEFAULT_SKILL_LEVEL,
    } = req.body;

    if (!fen) {
      return res.status(400).json({ error: "FEN position is required" });
    }

    console.log(`Processing position: ${fen}`);
    console.log(`Depth: ${depth}, Skill: ${skill}`);

    // Use environment variable if available, otherwise fall back to hardcoded path
    const stockfishPath = path.join(
      os.homedir(),
      ENV.STOCKFISH_PATH ||
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
    await engine.setoption("Skill Level", skill.toString());
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
  res.json({
    status: "ok",
    message: "Chess API is running",
    environment: ENV.NODE_ENV,
    mongoConnection:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    aiManagerRunning: AIManagerService.isRunning,
  });
});

// Start the AI Manager Service once the server is running
const startAIManager = () => {
  // Initialize and start the AI manager with default settings
  AIManagerService.initialize({
    targetGameCount: 5, // For testing, start with a smaller number
    checkInterval: 20000, // 20 seconds
    minAiLevel: 5,
    maxAiLevel: 15,
  });

  AIManagerService.start();

  // Clean shutdown of AIManager on exit
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down AI Manager...");
    AIManagerService.stop();
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down AI Manager...");
    AIManagerService.stop();
  });
};

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${ENV.NODE_ENV}`);

  // Start the AI Manager after the server is running
  startAIManager();
});
