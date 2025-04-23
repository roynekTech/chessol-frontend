import React from "react";
import { Color } from "chess.js";
import { Badge } from "@/components/ui/badge"; // Using Shadcn Badge
import { estimateElo } from "../../utils/chessUtils"; // Assuming path is correct

// --- Prop Types ---
interface IGameInfoProps {
  gameMode: "human" | "computer";
  isSpectating?: boolean;
  // Computer mode specific
  // computerColor?: Color; // Removed unused prop
  playerColor?: Color; // The color the human player is playing AS in HvC
  difficulty?: number;
  // Human mode specific (placeholders for WS data)
  opponentName?: string;
  isConnected?: boolean;
  gameId?: string; // Optional Game ID to display
}

// --- GameInfo Component ---
export const GameInfo: React.FC<IGameInfoProps> = ({
  gameMode,
  isSpectating = false,
  // computerColor, // Removed unused prop
  playerColor,
  difficulty,
  opponentName = "Opponent", // Default opponent name
  isConnected = false, // Default connection status
  gameId,
}) => {
  const renderComputerDetails = () => {
    if (
      gameMode !== "computer" ||
      difficulty === undefined ||
      playerColor === undefined
    ) {
      return null;
    }
    return (
      <>
        <span className="text-gray-500 hidden sm:inline">•</span>
        <span className="whitespace-nowrap">
          As: <span className="font-semibold uppercase">{playerColor}</span>
        </span>
        <span className="text-gray-500 hidden sm:inline">•</span>
        <span className="whitespace-nowrap">
          ELO: <span className="font-semibold">~{estimateElo(difficulty)}</span>
        </span>
      </>
    );
  };

  const renderHumanDetails = () => {
    if (gameMode !== "human") {
      return null;
    }
    // TODO: Enhance with connection status, maybe user avatars?
    return (
      <>
        <span className="text-gray-500 hidden sm:inline">•</span>
        <span className="whitespace-nowrap">
          vs <span className="font-semibold">{opponentName}</span>
        </span>
        <span className="text-gray-500 hidden sm:inline">•</span>
        <Badge
          variant={isConnected ? "default" : "destructive"}
          className="px-1.5 py-0.5 text-xs"
        >
          {isConnected ? "Connected" : "Offline"}
        </Badge>
      </>
    );
  };

  return (
    <div className="bg-black/50 p-2 sm:p-3 rounded-lg shadow-lg text-xs sm:text-sm">
      <div className="flex flex-wrap items-center justify-end gap-x-2 sm:gap-x-3 gap-y-1">
        {/* Spectator Badge */}
        {isSpectating && (
          <Badge
            variant="secondary"
            className="bg-purple-900/70 text-white px-1.5 py-0.5 text-xs font-semibold"
          >
            Spectating
          </Badge>
        )}

        {/* Optional Game ID */}
        {gameId && (
          <span className="text-gray-400 font-mono text-xs hidden md:inline">
            ID: {gameId}
          </span>
        )}

        {/* Game Mode Icon/Text */}
        <span className="font-semibold">
          {gameMode === "human" ? "👤 vs 👤" : "👤 vs 💻"}
        </span>

        {/* Mode Specific Details */}
        {gameMode === "computer" && renderComputerDetails()}
        {gameMode === "human" && renderHumanDetails()}
      </div>
    </div>
  );
};

export default GameInfo;
