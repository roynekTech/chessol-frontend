import { useChessGameStore } from "../../stores/chessGameStore";
import { Color } from "chess.js";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { LocalStorageRoomTypeEnum } from "../../utils/type";
import { helperUtil } from "../../utils/helper";

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
    <div className="flex flex-col items-center w-full">
      {/* Player Info Card */}
      <div className="w-full px-2 py-2 sm:px-4 sm:py-3">
        <div className="flex-col md:flex-row items-center justify-between">
          {/* Avatar and Name */}
          <div className="flex-col md:flex-row justify-center items-center gap-2 sm:gap-3">
            <Avatar
              className={`w-10 h-10 sm:w-12 sm:h-12 ${
                isPlayer && !isSpectator ? "ring-2 ring-amber-500" : ""
              } mx-auto`}
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
            <div className="flex flex-col mt-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-center justify-center">
                <span className="font-bold text-sm sm:text-lg text-white">
                  {playerObject.name}
                </span>
                {isPlayer && !isSpectator && (
                  <span className="text-xs bg-amber-600/30 border border-amber-600/50 px-1 py-0.5 sm:px-1.5 rounded-full">
                    You
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm text-gray-400 text-center">
                {color === "w" ? "White" : "Black"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
