import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export const ENV = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3001,

  // MongoDB configuration
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/chessol",

  // JWT Authentication
  JWT_SECRET: process.env.JWT_SECRET || "your-default-jwt-secret-for-dev",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Stockfish configuration
  STOCKFISH_PATH: process.env.STOCKFISH_PATH || "",

  // Default game configuration
  DEFAULT_SKILL_LEVEL: Number(process.env.DEFAULT_SKILL_LEVEL || 10),
  DEFAULT_DEPTH: Number(process.env.DEFAULT_DEPTH || 15),

  // Solana configuration (for future use)
  SOLANA_NETWORK: process.env.SOLANA_NETWORK || "devnet",
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
};

// Game constants
export const GAME_CONSTANTS = {
  DEFAULT_TIME_CONTROL: 600, // 10 minutes in seconds
  DEFAULT_INCREMENT: 5, // 5 seconds
  DEFAULT_INITIAL_POSITION:
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Standard chess position
};
