import { Engine } from "node-uci";
import path from "path";
import os from "os";
import fs from "fs";
import { ENV } from "../config/constants";
import { GameDifficultyEnum } from "../models/Game";

export interface IStockfishMoveResult {
  bestMove: string;
  from: string;
  to: string;
  promotion?: string;
}

function mapDifficultyToSkillLevel(difficulty: GameDifficultyEnum): number {
  switch (difficulty) {
    case GameDifficultyEnum.EASY:
      return 5;
    case GameDifficultyEnum.MEDIUM:
      return 12;
    case GameDifficultyEnum.HARD:
      return 20;
    default:
      return 5;
  }
}

async function getBestMove(
  fen: string,
  depth: number = ENV.DEFAULT_DEPTH,
  skill: number = ENV.DEFAULT_SKILL_LEVEL
): Promise<IStockfishMoveResult> {
  if (!fen) {
    throw new Error("FEN position is required");
  }

  console.log(`[StockfishService] Processing position: ${fen}`);

  // Use environment variable if available, otherwise fall back to hardcoded path
  const stockfishPath = path.join(
    os.homedir(),
    ENV.STOCKFISH_PATH || "Downloads/stockfish/stockfish-macos-m1-apple-silicon"
  );

  // Check if the file exists
  if (!fs.existsSync(stockfishPath)) {
    console.error(`Stockfish executable not found at: ${stockfishPath}`);
    throw new Error("Stockfish executable not found");
  }

  console.log(`[StockfishService] Using Stockfish at: ${stockfishPath}`);

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
}

export const stockfishService = {
  getBestMove,
  mapDifficultyToSkillLevel,
};
