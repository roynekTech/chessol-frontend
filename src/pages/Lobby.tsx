import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { localStorageHelper } from "../utils/localStorageHelper";
import { LocalStorageKeysEnum, IGameDetailsLocalStorage } from "../utils/type";

export function Lobby() {
  const [gameId, setGameId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch game details from localStorage
    const details = localStorageHelper.getItem(
      LocalStorageKeysEnum.GameDetails
    ) as IGameDetailsLocalStorage | null;
    if (details?.gameId) setGameId(details.gameId);
  }, []);

  const handleCopy = () => {
    if (!gameId) return;
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900">
      <div className="relative w-full max-w-md mx-auto rounded-2xl bg-gradient-to-b from-gray-900/80 to-black/90 border border-amber-900/30 shadow-2xl shadow-amber-900/10 p-8 sm:p-10 backdrop-blur-xl">
        {/* Animated waiting icon */}
        <div className="flex flex-col items-center mb-8">
          <svg
            className="animate-spin h-12 w-12 text-amber-400 mb-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <h1 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text mb-2">
            Waiting for opponent to join...
          </h1>
          <p className="text-gray-400 text-center max-w-xs">
            Share your Game ID with your friend or wait for a random opponent to
            join.
          </p>
        </div>
        {/* Game ID display */}
        <div className="flex items-center justify-between bg-black/60 border border-gray-700 rounded-xl px-4 py-3 mb-4">
          <span
            className="font-mono text-lg text-amber-400 truncate"
            title={gameId}
          >
            {gameId || "No Game ID"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy Game ID"
            className="ml-2 text-amber-400 hover:text-white hover:bg-amber-500/10 focus:ring-amber-500"
            disabled={!gameId}
          >
            <Copy className="h-5 w-5" />
          </Button>
        </div>
        {/* Copied feedback */}
        {copied && (
          <div className="absolute top-4 right-4 bg-amber-600/90 text-white px-3 py-1 rounded-lg shadow-lg text-sm animate-fade-in-out">
            Copied!
          </div>
        )}
        {/* Optionally, add a cancel/leave button or more info here */}
      </div>
    </div>
  );
}
