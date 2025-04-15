import { Square } from "chess.js";

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
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};
