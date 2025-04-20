import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Crown, LogOut } from "lucide-react";
import { localStorageHelper } from "../utils/localStorageHelper";
import { LocalStorageKeysEnum, IGameDetailsLocalStorage } from "../utils/type";
import { useNavigate } from "react-router-dom";

// Array of chess tips/facts for engagement
const CHESS_TIPS = [
  "Control the center early for a strong position.",
  "Develop your pieces before moving the same piece twice.",
  "Castle early to protect your king.",
  "Don't bring your queen out too soon.",
  "Always be aware of your opponent's threats.",
  "A knight on the rim is dim!",
  "Passed pawns should be pushed.",
  "Look for tactics: forks, pins, and skewers.",
  "The best defense is a good offense.",
  "Endgames are just as important as openings!",
  "Chess is 99% tactics.",
];

export function Lobby() {
  const [gameId, setGameId] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [tip, setTip] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch game details from localStorage
    const details = localStorageHelper.getItem(
      LocalStorageKeysEnum.GameDetails
    ) as IGameDetailsLocalStorage | null;
    if (details?.gameId) setGameId(details.gameId);
    // Pick a random tip
    setTip(CHESS_TIPS[Math.floor(Math.random() * CHESS_TIPS.length)]);
  }, []);

  const handleCopy = () => {
    if (!gameId) return;
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Leave lobby: clear localStorage and navigate to ongoing games
  const handleLeave = () => {
    localStorageHelper.deleteItem(LocalStorageKeysEnum.GameDetails);
    navigate("/games");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900">
      {/* Subtle background glows for depth */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full filter blur-3xl pointer-events-none z-0"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-800/10 rounded-full filter blur-3xl pointer-events-none z-0"></div>
      <div className="relative w-full max-w-md mx-auto rounded-2xl bg-gradient-to-b from-gray-900/80 to-black/90 border border-amber-900/30 shadow-2xl shadow-amber-900/10 p-8 sm:p-10 backdrop-blur-xl z-10">
        {/* Animated waiting avatar and message */}
        <div className="flex flex-col items-center mb-8">
          {/* Pulsing chess king avatar */}
          <div className="relative mb-4">
            <span className="absolute inset-0 flex items-center justify-center animate-ping-slow">
              <Crown className="w-16 h-16 text-amber-400 opacity-30" />
            </span>
            <span className="relative z-10">
              <Crown className="w-16 h-16 text-amber-400 drop-shadow-lg" />
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text mb-2">
            Waiting for opponent to join...
          </h1>
          <p className="text-gray-400 text-center max-w-xs">
            Share your Game ID with your friend or wait for a random opponent to
            join.
          </p>
        </div>
        {/* Game ID display with glassmorphism and tooltip */}
        <div className="flex items-center justify-between bg-black/60 border border-gray-700 rounded-xl px-4 py-3 mb-4 backdrop-blur-md shadow-lg relative group">
          <span
            className="font-mono text-lg text-amber-400 truncate select-all cursor-pointer"
            title={gameId}
            tabIndex={0}
            aria-label="Game ID"
            onClick={handleCopy}
          >
            {gameId || "No Game ID"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            aria-label="Copy Game ID"
            className="ml-2 text-amber-400 hover:text-white hover:bg-amber-500/10 focus:ring-amber-500 focus:outline-none"
            disabled={!gameId}
          >
            <Copy className="h-5 w-5" />
          </Button>
          {/* Tooltip on hover/focus */}
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-900/90 text-gray-200 text-xs px-3 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none">
            Click or tap to copy
          </span>
        </div>
        {/* Copied feedback with fade animation */}
        {copied && (
          <div className="absolute top-4 right-4 bg-amber-600/90 text-white px-3 py-1 rounded-lg shadow-lg text-sm animate-fade-in-out z-20">
            Copied!
          </div>
        )}
        {/* Chess tip/fact for engagement */}
        <div className="mb-6 mt-2 text-center">
          <span className="inline-block bg-black/40 text-amber-300 px-4 py-2 rounded-lg text-sm shadow-sm border border-amber-900/20">
            <span className="font-semibold mr-1">Tip:</span> {tip}
          </span>
        </div>
        {/* Leave Lobby button */}
        <Button
            variant="outline"
            className={`
                w-full py-4 rounded-xl
                border border-gray-700
                bg-black/70
                text-gray-100 font-semibold
                shadow
                flex items-center justify-center gap-2
                transition-colors duration-200
                hover:bg-gray-800 hover:text-amber-400 hover:border-amber-400
                focus:ring-2 focus:ring-amber-400 focus:outline-none
                backdrop-blur-md
            `}
            onClick={handleLeave}
            aria-label="Leave Lobby"
        >
            <LogOut className="h-5 w-5 mr-2" /> Leave Lobby
        </Button>
      </div>
      {/* Custom animation for ping effect */}
      <style>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.3; }
          70% { transform: scale(1.3); opacity: 0.1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-fade-in-out {
          animation: fade-in-out 1.5s;
        }
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(-10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
