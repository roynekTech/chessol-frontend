import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Crown, LogOut } from "lucide-react";
import { localStorageHelper } from "../utils/localStorageHelper";
import {
  LocalStorageKeysEnum,
  IWSPairedMessage,
  IGetGameDataMemResponse,
  GameStateEnum,
} from "../utils/type";
import { useNavigate } from "react-router-dom";
import { useWebSocketContext } from "../context/useWebSocketContext";
import { WebSocketMessageTypeEnum } from "../utils/type";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PAGE_ROUTES, API_PATHS } from "../utils/constants";
import { useChessGameStore } from "../stores/chessGameStore";
import { useGetData } from "../utils/use-query-hooks";

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
  const { lastMessage } = useWebSocketContext();
  const gameState = useChessGameStore((state) => state.gameState);

  // Fetch game state periodically
  useGetData<IGetGameDataMemResponse>(
    API_PATHS.getInMemGameDetails(gameId),
    ["gameDetails", gameId],
    {
      enabled: !!gameId,
      refetchInterval: 3000, // Poll every 3 seconds
      onSuccess: (data: IGetGameDataMemResponse) => {
        // Check if game is active/running and redirect if needed
        if (
          data?.game_state === GameStateEnum.Active ||
          data?.game_state === GameStateEnum.Running ||
          data?.game_state === GameStateEnum.Joined
        ) {
          navigate(PAGE_ROUTES.GamePlay);
        }
      },
    }
  );

  // Fetch game details from localStorage and set a random tip and game ID
  useEffect(() => {
    if (!gameState) {
      window.location.href = PAGE_ROUTES.OngoingGames;
      return;
    }

    if (gameState?.gameId) {
      setGameId(gameState.gameId);
    }

    // Pick a random tip
    setTip(CHESS_TIPS[Math.floor(Math.random() * CHESS_TIPS.length)]);
  }, []);

  useEffect(() => {
    if (!lastMessage?.data) return;
    let messageData: IWSPairedMessage | { type: string; gameId?: string };
    try {
      messageData = JSON.parse(lastMessage.data);
    } catch {
      return;
    }
    // Listen for paired event for this game
    if (
      messageData.type === WebSocketMessageTypeEnum.Joined &&
      messageData.gameId === gameId
    ) {
      // Optionally, show a quick message or spinner here
      navigate(PAGE_ROUTES.GamePlay);
    }
  }, [lastMessage, gameId, navigate]);

  const handleCopy = () => {
    if (!gameId) return;
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Leave lobby: clear localStorage and navigate to ongoing games
  const handleLeave = () => {
    localStorageHelper.deleteItem(LocalStorageKeysEnum.GameDetails);
    localStorageHelper.deleteItem(LocalStorageKeysEnum.GameState);
    window.location.href = PAGE_ROUTES.OngoingGames;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-black to-gray-900 p-4">
      {/* Subtle background glows for depth */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full filter blur-3xl pointer-events-none z-0"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-800/10 rounded-full filter blur-3xl pointer-events-none z-0"></div>

      {/* Main Lobby Card */}
      <Card className="relative w-full max-w-md mx-auto rounded-2xl bg-gradient-to-b from-gray-900/80 to-black/90 border border-amber-900/30 shadow-2xl shadow-amber-900/10 backdrop-blur-xl z-10 overflow-hidden">
        <CardHeader className="items-center text-center pt-8 sm:pt-10 pb-6">
          {/* Updated Header Icons */}
          <div className="flex items-center justify-center space-x-4 mb-5">
            <Crown className="w-12 h-12 text-amber-400 drop-shadow-lg" />
            <Crown className="w-12 h-12 text-amber-400/30" />
          </div>

          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text mb-1">
            Waiting for Opponent
          </CardTitle>
          <CardDescription className="text-gray-400 max-w-xs">
            Share the Game ID below or wait for someone to join.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-6">
          {/* Game ID display with adjusted styling */}
          <TooltipProvider delayDuration={100}>
            <div className="flex items-center justify-between bg-black/50 border border-white/10 rounded-lg px-4 py-3 mb-5 backdrop-blur-sm shadow-inner">
              <span
                className="font-mono text-lg text-amber-400 truncate select-all"
                aria-label="Game ID"
              >
                {gameId || "Generating ID..."}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-gray-900/90 text-gray-200 border-gray-700"
                >
                  <p>Click to copy Game ID</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Copied feedback with fade animation */}
          {copied && (
            <div className="absolute top-4 right-4 bg-green-600/90 text-white px-3 py-1 rounded-lg shadow-lg text-sm animate-fade-in-out z-20">
              Copied!
            </div>
          )}

          {/* Chess tip/fact with adjusted styling */}
          <div className="text-center">
            <span className="inline-block bg-black/30 text-amber-300 px-4 py-2 rounded-lg text-sm shadow-sm border border-amber-900/20">
              <span className="font-semibold mr-1 text-amber-400">Tip:</span>{" "}
              {tip}
            </span>
          </div>
        </CardContent>

        <CardFooter className="px-6 sm:px-8 pb-8 sm:pb-10">
          {/* Leave Lobby button */}
          <Button
            variant="outline"
            className="w-full py-3 rounded-xl border border-gray-700 hover:border-amber-400 bg-black/70 hover:bg-gray-800/70 text-gray-300 hover:text-amber-400 font-semibold shadow flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-amber-500/20 focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-amber-400 focus:outline-none backdrop-blur-md cursor-pointer"
            onClick={handleLeave}
            aria-label="Leave Lobby"
          >
            <LogOut className="h-5 w-5" /> Leave Lobby
          </Button>
        </CardFooter>
      </Card>

      {/* Custom animation definitions (Consider moving to tailwind.config.js) */}
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
