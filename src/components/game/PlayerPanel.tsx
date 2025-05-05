// import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { useChessGameStore } from "../../stores/chessGameStore";
import { formatTime } from "../../utils/chessUtils";
import { motion } from "framer-motion";
import { Color } from "chess.js";
import { Avatar, AvatarFallback } from "../ui/avatar";

export function PlayerPanel({ color }: { color: Color }) {
  const gameState = useChessGameStore((state) => state.gameState);

  const playerTurn = gameState.playerTurn;
  const playerColor = gameState.playerColor;

  // Use the stable orientation for player identity as well
  const isPlayer = playerTurn === playerColor;
  const player = {
    name: isPlayer ? "You" : "Opponent",
  };
  const isCurrentTurn = playerTurn === playerColor;
  const timeRemaining =
    playerColor === "w"
      ? gameState.whitePlayerTimerInMilliseconds
      : gameState.blackPlayerTimerInMilliseconds;
  const capturedPieces = gameState.capturedPieces[gameState.playerColor];

  // Use the stable orientation for panel positioning
  const shouldBeTop = playerColor === "w" ? color === "b" : color === "w";

  return (
    <div
      className={`
          bg-gray-900/60 backdrop-blur-sm rounded-xl p-3 sm:p-4
          border ${
            isCurrentTurn ? "border-amber-500/50" : "border-amber-900/20"
          } shadow-lg
          ${shouldBeTop ? "mb-4 sm:mb-8" : "mt-4 sm:mt-8"}
        `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Avatar
            className={
              isPlayer
                ? "ring-2 ring-amber-500 w-8 h-8 sm:w-10 sm:h-10"
                : "w-8 h-8 sm:w-10 sm:h-10"
            }
          >
            <AvatarFallback
              className={
                isPlayer
                  ? "bg-amber-700 text-sm sm:text-base"
                  : "bg-gray-700 text-sm sm:text-base"
              }
            >
              {player.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-white flex items-center flex-wrap gap-1 sm:gap-2 text-sm sm:text-base">
              {player.name}
              {isPlayer && (
                <span className="text-xs bg-amber-600/30 border border-amber-600/50 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                  You
                </span>
              )}
              {isCurrentTurn && (
                <span className="text-xs bg-green-600/30 border border-green-600/50 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                  {isPlayer ? "Your Turn" : "Turn"}
                </span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400">
              {playerColor === "w" ? "White" : "Black"}
            </p>
          </div>
        </div>
        <div
          className={`text-lg sm:text-2xl font-mono font-bold ${
            timeRemaining <= 30 ? "text-red-500" : "text-white"
          }`}
        >
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Captured Pieces - made more responsive */}
      {capturedPieces.length > 0 && (
        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
          {capturedPieces.map((piece, index) => (
            <motion.div
              key={`${piece.type}-${index}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.8 }}
              className="w-5 h-5 sm:w-6 sm:h-6"
            >
              <img
                src={`https://www.chess.com/chess-themes/pieces/neo/150/${piece.color}${piece.type}.png`}
                alt={`${piece.color}${piece.type}`}
                className="w-full h-full object-contain opacity-75"
              />
            </motion.div>
          ))}
        </div>
      )}

      {isCurrentTurn && (
        <div className="mt-2 h-1 w-full bg-amber-500/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 animate-pulse"
            style={{ width: "100%" }}
          />
        </div>
      )}
    </div>
  );
}
