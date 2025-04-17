import { Chess } from "chess.js";
import { GameStatusEnum } from "../models/Game";
import { GameResultEnum } from "../models/types";

function determineGameResult(fen: string): GameResultEnum {
  try {
    const chess = new Chess(fen);

    // Check for checkmate or stalemate
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        // In checkmate, the side to move has lost
        return chess.turn() === "w"
          ? GameResultEnum.BLACK_WIN
          : GameResultEnum.WHITE_WIN;
      } else if (chess.isDraw()) {
        // Handle explicit draw conditions (stalemate, insufficient material, etc.)
        return GameResultEnum.DRAW;
      }
    }

    // If game isn't technically over, evaluate material advantage
    const pieces = fen.split(" ")[0];

    // Count material with piece values (P=1, N/B=3, R=5, Q=9)
    let whiteValue = 0;
    let blackValue = 0;

    // Count material with appropriate piece values
    for (const char of pieces) {
      switch (char) {
        case "P":
          whiteValue += 1;
          break;
        case "N":
        case "B":
          whiteValue += 3;
          break;
        case "R":
          whiteValue += 5;
          break;
        case "Q":
          whiteValue += 9;
          break;

        case "p":
          blackValue += 1;
          break;
        case "n":
        case "b":
          blackValue += 3;
          break;
        case "r":
          blackValue += 5;
          break;
        case "q":
          blackValue += 9;
          break;
      }
    }

    const valueDiff = whiteValue - blackValue;

    // Significant material advantage (more than a rook)
    if (valueDiff > 5) {
      return GameResultEnum.WHITE_WIN;
    } else if (valueDiff < -5) {
      return GameResultEnum.BLACK_WIN;
    }

    // If time ran out but material is approximately equal, call it a draw
    return GameResultEnum.DRAW;
  } catch (error) {
    console.error("Error determining game result:", error);
    // If we can't determine, default to draw
    return GameResultEnum.DRAW;
  }
}

function determineGameOutcome(game: any): {
  status: GameStatusEnum;
  result: GameResultEnum;
} {
  // If we already have a non-ongoing result, keep it
  if (game.result !== GameResultEnum.ONGOING) {
    return {
      status: GameStatusEnum.COMPLETED,
      result: game.result,
    };
  }

  // Use the FEN to determine the chess result
  const result = determineGameResult(game.currentPosition);

  return {
    status: GameStatusEnum.COMPLETED,
    result,
  };
}

export const gameUtils = {
  determineGameResult,
  determineGameOutcome,
};
