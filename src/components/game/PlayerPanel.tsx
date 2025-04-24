import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Crown, Clock, RotateCw } from "lucide-react";
import { Color, PieceSymbol } from "chess.js"; // Using PieceSymbol which covers 'p', 'n', 'b', 'r', 'q', 'k'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

// --- Prop Types ---
interface ICapturedPiece {
  type: PieceSymbol;
  color: Color; // Color of the captured piece itself
}

interface IPlayerPanelProps {
  playerColor: Color; // 'w' or 'b' for this panel
  playerName?: string; // Optional name (e.g., "Player 1", "Computer")
  isCurrentPlayer: boolean; // Is it this player's turn?
  timerValue: number; // Time remaining in seconds
  capturedPieces: ICapturedPiece[]; // Pieces captured BY the opponent
  moveHistory?: string[]; // Optional move history (can be its own component)
  onRestart?: () => void; // Optional handler for restart button
  showRestartButton?: boolean; // Control visibility of restart button
  getPieceImageUrl: (piece: { type: PieceSymbol; color: Color }) => string; // Function to get image URL
  formatTime: (seconds: number) => string; // Function to format time
  isPlayer?: boolean; // Indicates if this panel represents the user viewing the game
  isConnected?: boolean; // Indicates if the player represented by this panel is connected
}

// --- Helper: Move History Display (Internal or could be separate) ---
const MoveHistoryDisplayInternal: React.FC<{ history: string[] }> = ({
  history,
}) => {
  if (history.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic text-center py-4">
        No moves yet
      </div>
    );
  }
  const pairs = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      black: i + 1 < history.length ? history[i + 1] : null,
    });
  }
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-1">
      {pairs.map((pair, idx) => (
        <React.Fragment key={idx}>
          <div className="text-gray-500 text-xs p-1 text-right">
            {pair.number}.
          </div>
          {/* Assuming white is always first element */}
          <div className="bg-gray-800/50 p-1 rounded text-sm font-mono truncate">
            <span className="text-white font-bold">w:</span> {pair.white}
          </div>
          {pair.black ? (
            <div className="bg-gray-800/50 p-1 rounded text-sm font-mono truncate">
              {/* Use color indicator for player's side */}
              <span className="text-amber-400 font-bold">b:</span> {pair.black}
            </div>
          ) : (
            <div className="p-1"></div> // Placeholder for alignment
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// --- PlayerPanel Component ---
export const PlayerPanel: React.FC<IPlayerPanelProps> = ({
  playerColor,
  playerName,
  isCurrentPlayer,
  timerValue,
  capturedPieces,
  moveHistory = [], // Default to empty array
  onRestart,
  showRestartButton = false, // Default to false
  getPieceImageUrl,
  formatTime,
}) => {
  const defaultName = playerColor === "w" ? "White Player" : "Black Player";
  const crownColorClass = isCurrentPlayer ? "text-yellow-400" : "text-gray-500";
  const timerColorClass = timerValue < 60 ? "text-red-500" : "text-gray-300";

  const bgColorClass = playerColor === "w" ? "bg-white" : "bg-black";
  const textColorClass = playerColor === "w" ? "text-black" : "text-white";

  return (
    <div className="bg-black/30 rounded-lg p-4 flex flex-col h-full">
      {/* --- Player Info Section --- */}
      <div className="flex items-center mb-4">
        <div
          className={`${bgColorClass} rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center ${textColorClass} mr-3 sm:mr-4`}
        >
          <Crown className={`w-5 h-5 sm:w-6 sm:h-6 ${crownColorClass}`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base sm:text-lg truncate">
            {playerName || defaultName}
          </h3>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-red-400 flex-shrink-0" />
            <span className={`font-mono ${timerColorClass}`}>
              {formatTime(timerValue)}
            </span>
          </div>
        </div>
      </div>

      {/* --- Captured Pieces Section --- */}
      <div className="mb-3 sm:mb-4">
        <h4 className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
          Captured ({capturedPieces.length})
        </h4>
        {/* Use min-h to prevent collapse when empty */}
        <div className="flex flex-wrap gap-1 min-h-[2rem] sm:min-h-[2.5rem]">
          {capturedPieces.map((piece, idx) => (
            <motion.div
              key={`${piece.color}${piece.type}-${idx}`} // More robust key
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }} // Stagger animation
              className="w-6 h-6 sm:w-8 sm:h-8"
              title={`${piece.color === "w" ? "White" : "Black"} ${piece.type}`} // Tooltip for piece type
            >
              <img
                src={getPieceImageUrl(piece)}
                alt={`${piece.color}${piece.type}`}
                className="w-full h-full object-contain"
              />
            </motion.div>
          ))}
          {capturedPieces.length === 0 && (
            <span className="text-xs text-gray-500 italic">None</span>
          )}
        </div>
      </div>

      {/* --- Move History Section --- */}
      <div className="flex-1 overflow-hidden flex flex-col mb-4">
        {" "}
        {/* Added flex flex-col */}
        <h4 className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2 flex-shrink-0">
          Moves
        </h4>
        {/* Added flex-1 and overflow-y-auto here */}
        {/* Added max-h-60 to constrain vertical growth and enforce scrolling */}
        <div className="bg-black/40 rounded p-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-track-black/20 scrollbar-thumb-gray-700 min-h-[50px] max-h-60">
          <MoveHistoryDisplayInternal history={moveHistory} />
        </div>
      </div>

      {/* --- Game Controls (Optional) --- */}
      {showRestartButton && onRestart && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <div className="mt-auto pt-4">
              <Button
                variant="default"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                aria-label="Restart Game"
              >
                <RotateCw className="w-4 h-4 mr-2" /> Restart
              </Button>
            </div>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This action cannot be undone. This will reset the current game
                and you will lose your progress.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-white hover:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onRestart} // Execute the restart function on confirm
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Restart
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default PlayerPanel;
