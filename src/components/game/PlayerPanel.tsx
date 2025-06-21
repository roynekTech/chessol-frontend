import { useChessGameStore } from "../../stores/chessGameStore";
import { Color } from "chess.js";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { LocalStorageRoomTypeEnum } from "../../utils/type";
import { helperUtil } from "../../utils/helper";
import { formatTime } from "../../utils/chessUtils";

export function PlayerPanel({ color }: { color: Color }) {
  const gameState = useChessGameStore((state) => state.gameState);

  // console.log("game state player panel", gameState);

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

  return (
    <div className="flex items-center w-full bg-gray-900/40 rounded-xl p-2 sm:p-3 space-x-3">
      {/* Avatar */}
      <Avatar
        className={`w-12 h-12 sm:w-14 sm:h-14 ${
          isPlayer && !isSpectator ? "ring-2 ring-amber-500" : ""
        }`}
      >
        <img
          src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${encodeURIComponent(
            playerObject.name
          )}`}
          alt={playerObject.name}
          className="w-full h-full object-cover rounded-full"
          draggable={false}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <AvatarFallback
          className={`${
            isPlayer && !isSpectator
              ? "bg-amber-700 text-base sm:text-lg"
              : "bg-gray-700 text-base sm:text-lg"
          } text-center`}
        >
          {playerObject.name[0]}
        </AvatarFallback>
      </Avatar>

      {/* Player Info */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm sm:text-base text-white">
            {playerObject.name}
          </span>
          {isPlayer && !isSpectator && (
            <span className="text-xs bg-amber-600/30 border border-amber-600/50 px-1.5 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm text-gray-400">
            {color === "w" ? "White" : "Black"}
          </span>
          <span
            className={`font-mono font-bold text-sm sm:text-base px-2 py-0.5 rounded-lg bg-gray-950/40 ${
              (color === "w"
                ? gameState.whitePlayerTimerInMilliseconds
                : gameState.blackPlayerTimerInMilliseconds) <= 30000
                ? "text-red-500"
                : "text-white"
            }`}
            aria-label={`${color === "w" ? "White" : "Black"} timer`}
          >
            {formatTime(
              color === "w"
                ? gameState.whitePlayerTimerInMilliseconds
                : gameState.blackPlayerTimerInMilliseconds
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
