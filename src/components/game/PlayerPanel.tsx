import { useChessGameStore } from "../../stores/chessGameStore";
import { formatTime } from "../../utils/chessUtils";
import { motion } from "framer-motion";
import { Color } from "chess.js";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { LocalStorageRoomTypeEnum } from "../../utils/type";
import { helperUtil } from "../../utils/helper";

export function PlayerPanel({ color }: { color: Color }) {
  const gameState = useChessGameStore((state) => state.gameState);

  // console.log("game state player panel", gameState);

  const playerTurn = gameState.playerTurn;
  const playerColor = gameState.playerColor;

  // Use the stable orientation for player identity as well
  const isPlayer = color === playerColor;
  const isSpectator = gameState.roomType === LocalStorageRoomTypeEnum.SPECTATOR;
  let playerObject: { name: string; wallet?: string };

  // TODO: add the wallet address once it's available in the state and use it for the avatar
  let walletAddress = "";
  if (gameState.roomType === LocalStorageRoomTypeEnum.PLAYER) {
    playerObject = {
      name: isPlayer ? "You" : "Opponent",
      wallet: gameState.playerWalletAddress,
    };
    walletAddress = gameState.playerWalletAddress || "player";
  } else {
    // For spectators, show the actual wallet addresses if available
    if (color === "w" && gameState.player1Wallet) {
      walletAddress = gameState.player1Wallet;
    } else if (color === "b" && gameState.player2Wallet) {
      walletAddress = gameState.player2Wallet;
    } else {
      walletAddress = color === "w" ? "player1" : "player2";
    }
    playerObject = {
      name: helperUtil?.shortenWalletAddress
        ? helperUtil.shortenWalletAddress(walletAddress)
        : walletAddress,
      wallet: walletAddress,
    };
  }
  const isCurrentTurn = playerTurn === color;
  const timeRemaining =
    color === "w"
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
              isPlayer && !isSpectator
                ? "ring-2 ring-amber-500 w-8 h-8 sm:w-10 sm:h-10"
                : "w-8 h-8 sm:w-10 sm:h-10"
            }
          >
            {/* DiceBear avatar based on wallet address or fallback */}
            <img
              src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(
                playerObject.name
              )}`}
              alt={playerObject.name}
              className="w-full h-full object-cover rounded-full"
              draggable={false}
              onError={(e) => {
                // fallback to AvatarFallback if image fails
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <AvatarFallback
              className={
                isPlayer && !isSpectator
                  ? "bg-amber-700 text-sm sm:text-base"
                  : "bg-gray-700 text-sm sm:text-base"
              }
            >
              {playerObject.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-white flex items-center flex-wrap gap-1 sm:gap-2 text-sm sm:text-base">
              {playerObject.name}
              {/* Only show 'You' if player and not spectator */}
              {isPlayer && !isSpectator && (
                <span className="text-xs bg-amber-600/30 border border-amber-600/50 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                  You
                </span>
              )}
              {/* Turn badge logic */}
              {isCurrentTurn && (
                <span className="text-xs bg-green-600/30 border border-green-600/50 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                  {isSpectator
                    ? "Player Turn"
                    : isPlayer
                    ? "Your Turn"
                    : "Turn"}
                </span>
              )}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400">
              {color === "w" ? "White" : "Black"}
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
