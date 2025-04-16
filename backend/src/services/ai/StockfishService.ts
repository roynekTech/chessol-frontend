import { Engine } from "node-uci";
import path from "path";
import os from "os";
import fs from "fs";
import { ENV } from "../../config/constants";

interface StockfishMoveResult {
  bestMove: string;
  from: string;
  to: string;
  promotion?: string;
}

/**
 * Service for interfacing with the Stockfish chess engine
 */
const StockfishService = {
  /**
   * Get the best move for a given position
   * @param fen The FEN notation of the current position
   * @param depth The depth to search (higher numbers are stronger but slower)
   * @param skill The skill level (1-20, higher is stronger)
   * @returns The best move information
   */
  getBestMove: async (
    fen: string,
    depth: number = ENV.DEFAULT_DEPTH,
    skill: number = ENV.DEFAULT_SKILL_LEVEL
  ): Promise<StockfishMoveResult> => {
    if (!fen) {
      throw new Error("FEN position is required");
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
      throw new Error("Stockfish executable not found");
    }

    console.log(`Using Stockfish at: ${stockfishPath}`);

    const engine = new Engine(stockfishPath);

    try {
      await engine.init();
      await engine.setoption("Skill Level", skill.toString());
      await engine.position(fen);

      console.log("Engine initialized, calculating best move...");
      const result = await engine.go({ depth });

      console.log(`Best move found: ${result.bestmove}`);

      // Parse the move to get from/to squares
      const from = result.bestmove.substring(0, 2);
      const to = result.bestmove.substring(2, 4);
      const promotion =
        result.bestmove.length > 4 ? result.bestmove.substring(4) : undefined;

      return {
        bestMove: result.bestmove,
        from,
        to,
        promotion,
      };
    } catch (error) {
      console.error("Error processing move:", error);
      throw new Error(
        `Failed to process move: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      // Always ensure the engine is terminated
      try {
        await engine.quit();
      } catch (err) {
        console.error("Error shutting down engine:", err);
      }
    }
  },
};

export default StockfishService;
