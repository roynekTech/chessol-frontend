import React from "react";
import { motion } from "framer-motion";
import { Square, Piece, Color } from "chess.js"; // Use types from chess.js

// --- Prop Types ---
interface IChessBoardProps {
  board: (Piece | null)[][]; // The 8x8 board representation from chess.js game.board()
  turn: Color; // Whose turn it is ('w' or 'b')
  selectedSquare: Square | null;
  validMoves: Square[];
  handleSquareClick: (square: Square) => void;
  lastMove?: { from: Square; to: Square } | null; // Optional: for highlighting last move
  moveTrail?: { from: Square; to: Square } | null; // Optional: for move animation trail
  boardOrientation?: Color; // Optional: ('w' or 'b') to flip the board
  // Add orientation prop if needed later ('w' or 'b')
}

// --- Helper: Get Piece Image URL ---
// Using chess.com neo set for now
const getPieceImage = (piece: Piece | null): string => {
  if (!piece) return "";
  const pieceImages: Record<string, string> = {
    wp: "https://www.chess.com/chess-themes/pieces/neo/150/wp.png",
    wn: "https://www.chess.com/chess-themes/pieces/neo/150/wn.png",
    wb: "https://www.chess.com/chess-themes/pieces/neo/150/wb.png",
    wr: "https://www.chess.com/chess-themes/pieces/neo/150/wr.png",
    wq: "https://www.chess.com/chess-themes/pieces/neo/150/wq.png",
    wk: "https://www.chess.com/chess-themes/pieces/neo/150/wk.png",
    bp: "https://www.chess.com/chess-themes/pieces/neo/150/bp.png",
    bn: "https://www.chess.com/chess-themes/pieces/neo/150/bn.png",
    bb: "https://www.chess.com/chess-themes/pieces/neo/150/bb.png",
    br: "https://www.chess.com/chess-themes/pieces/neo/150/br.png",
    bq: "https://www.chess.com/chess-themes/pieces/neo/150/bq.png",
    bk: "https://www.chess.com/chess-themes/pieces/neo/150/bk.png",
  };
  return pieceImages[`${piece.color}${piece.type}`] || "";
};

// --- ChessBoard Component ---
export const ChessBoard: React.FC<IChessBoardProps> = ({
  board,
  // turn, // Not directly used in rendering logic, but good to have
  selectedSquare,
  validMoves,
  handleSquareClick,
  lastMove,
  moveTrail,
  boardOrientation = "w", // Default to white's perspective
}) => {
  const filesBase = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const ranksBase = ["8", "7", "6", "5", "4", "3", "2", "1"];

  // Reverse ranks and files if orientation is black
  const files = boardOrientation === "b" ? [...filesBase].reverse() : filesBase;
  const ranks = boardOrientation === "b" ? [...ranksBase].reverse() : ranksBase;

  return (
    <div className="grid grid-cols-8 gap-0 border-4 border-amber-900 rounded-lg overflow-hidden shadow-xl aspect-square relative">
      {ranks
        .map((rank, rankIndexOriginal) =>
          files.map((file, fileIndexOriginal) => {
            // Determine the actual rank and file index based on orientation
            const rankIndex =
              boardOrientation === "b"
                ? 7 - rankIndexOriginal
                : rankIndexOriginal;
            const fileIndex =
              boardOrientation === "b"
                ? 7 - fileIndexOriginal
                : fileIndexOriginal;

            const squareId = (filesBase[fileIndex] +
              ranksBase[rankIndex]) as Square;
            const isLight = (fileIndex + rankIndex) % 2 === 1;
            const squareColor = isLight ? "bg-amber-200" : "bg-amber-800";
            // chess.js board() is indexed [rank][file] (0-7 for both)
            const piece = board[rankIndex]?.[fileIndex] ?? null;

            // --- Highlighting Logic ---
            let highlightClass = "";
            const isFromTrail = moveTrail && moveTrail.from === squareId;
            const isToTrail = moveTrail && moveTrail.to === squareId;
            const isFromLast = lastMove && lastMove.from === squareId;
            const isToLast = lastMove && lastMove.to === squareId;

            if (selectedSquare === squareId) {
              highlightClass = "ring-4 ring-yellow-400 z-10"; // Highlight selected piece
            } else if (validMoves.includes(squareId)) {
              highlightClass = piece
                ? "ring-4 ring-red-500 z-10" // Highlight capture move
                : "after:content-[''] after:absolute after:inset-0 after:m-auto after:w-3 after:h-3 after:rounded-full after:bg-gray-500/60"; // Dot for empty square move
            } else if (isFromTrail) {
              highlightClass = "bg-blue-500/50"; // Move trail start
            } else if (isToTrail) {
              highlightClass = "bg-green-500/50"; // Move trail end
            } else if ((isFromLast || isToLast) && !isFromTrail && !isToTrail) {
              highlightClass = "bg-yellow-400/30"; // Highlight last move squares if not part of current trail
            }

            return (
              <div
                key={squareId}
                className={`${squareColor} ${highlightClass} relative aspect-square cursor-pointer`} // Added cursor-pointer
                onClick={() => handleSquareClick(squareId)}
                role="button" // Accessibility: indicate it's clickable
                tabIndex={0} // Accessibility: make it focusable
                aria-label={`Square ${squareId}${
                  piece
                    ? `, contains ${piece.color === "w" ? "white" : "black"} ${
                        piece.type
                      }`
                    : ""
                }`}
              >
                {/* Coordinates */}
                {fileIndex === 0 && (
                  <span className="absolute left-1 top-0 text-xs font-bold text-black/50 select-none pointer-events-none">
                    {rank}
                  </span>
                )}
                {rankIndex === 7 && (
                  <span className="absolute right-1 bottom-0 text-xs font-bold text-black/50 select-none pointer-events-none">
                    {file}
                  </span>
                )}
                {/* Piece */}
                {piece && (
                  <motion.div
                    // Using squareId in key ensures re-render on move, but might be too much? Consider piece identity if issues arise.
                    key={`${piece.color}${piece.type}-${squareId}`}
                    // layoutId={`${piece.color}${piece.type}-${squareId}`} // Remove layoutId to prevent potential animation issues
                    // Removed initial/animate to prevent pop-in on every move render
                    // initial={{ scale: 0.8, opacity: 0 }}
                    // animate={{ scale: 1, opacity: 1 }}
                    // transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none" // Prevent image from blocking clicks
                  >
                    <img
                      src={getPieceImage(piece)}
                      alt={`${piece.color === "w" ? "White" : "Black"} ${
                        piece.type
                      }`} // More descriptive alt text
                      className="w-4/5 h-4/5 object-contain select-none"
                      draggable={false}
                    />
                  </motion.div>
                )}
              </div>
            );
          })
        )
        .flat()}
    </div>
  );
};

export default ChessBoard;
