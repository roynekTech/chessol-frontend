import { Chess, Color, PieceSymbol, Square } from "chess.js";

export interface ICapturedPiece {
  type: PieceSymbol;
  color: Color;
}

export interface ICalculateCapturedPiecesRes {
  w: ICapturedPiece[];
  b: ICapturedPiece[];
}

/**
 * Convert a string to a valid chess.js Square type
 * @param square The string representation of a square (e.g., "e4")
 * @returns The same string cast as a Square type
 */
export const toSquare = (square: string): Square => {
  return square as Square;
};

/**
 * Get difficulty description based on numeric level
 * @param level Numeric difficulty level (1-20)
 * @returns Human-readable difficulty description
 */
export const getDifficultyLabel = (level: number): string => {
  if (level <= 5) return "Beginner";
  if (level <= 10) return "Intermediate";
  if (level <= 15) return "Advanced";
  return "Master";
};

/**
 * Calculate estimated ELO rating based on Stockfish skill level
 * @param skillLevel Stockfish skill level (0-20)
 * @returns Estimated ELO rating
 */
export const estimateElo = (skillLevel: number): number => {
  // Rough estimation:
  // Skill 0 ≈ 1100 ELO
  // Skill 20 ≈ 3000 ELO
  return 1100 + skillLevel * 95;
};

/**
 * Get a piece's value in centipawns
 * @param pieceType Type of the piece (p, n, b, r, q, k)
 * @returns The value in centipawns
 */
export const getPieceValue = (pieceType: string): number => {
  const values: Record<string, number> = {
    p: 100, // pawn
    n: 320, // knight
    b: 330, // bishop
    r: 500, // rook
    q: 900, // queen
    k: 20000, // king
  };

  return values[pieceType] || 0;
};

/**
 * Format time in seconds to MM:SS
 * @param seconds Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export function calculateCapturedPieces(
  board: ReturnType<Chess["board"]>
): ICalculateCapturedPiecesRes {
  // Standard piece counts at the start of a game
  const startingCounts: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
  };

  // Current piece counts on the board
  const currentCounts: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  // Count pieces currently on the board
  for (const row of board) {
    for (const square of row) {
      if (square) {
        currentCounts[square.color][square.type]++;
      }
    }
  }

  const captured: { w: ICapturedPiece[]; b: ICapturedPiece[] } = {
    w: [],
    b: [],
  };

  // Determine captured pieces by comparing starting and current counts
  for (const color of ["w", "b"] as Color[]) {
    for (const type of ["p", "n", "b", "r", "q"] as PieceSymbol[]) {
      const diff = startingCounts[color][type] - currentCounts[color][type];
      if (diff > 0) {
        // The opponent captured 'diff' pieces of this type and color
        const capturingColor = color === "w" ? "b" : "w";
        for (let i = 0; i < diff; i++) {
          captured[capturingColor].push({ type, color });
        }
      }
    }
  }

  // Sort captured pieces (optional, e.g., by value)
  const pieceValues: Record<PieceSymbol, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 0,
  };
  captured.w.sort((a, b) => pieceValues[b.type] - pieceValues[a.type]);
  captured.b.sort((a, b) => pieceValues[b.type] - pieceValues[a.type]);

  return captured;
}
