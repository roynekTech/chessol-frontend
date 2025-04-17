import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Eye,
  Bot,
  Monitor,
  ChevronRight,
  Clock,
} from "lucide-react";
import { GameModeModal } from "@/components/GameModeModal";
import { useGetData } from "../utils/use-query-hooks";
import { DateTime } from "luxon";

interface IMove {
  from: string;
  to: string;
  fen: string;
  san: string;
  timestamp: string;
}

export interface IGame {
  _id: string;
  whitePlayer: string | null; // User ID or null for AI
  blackPlayer: string | null; // User ID or null for AI
  whitePlayerUsername: string;
  blackPlayerUsername: string;
  currentTurn: "w" | "b";
  moves: IMove[];
  status: string;
  result: string;
  currentPosition: string; // FEN
  initialPosition: string; // FEN
  difficulty?: string; // Added to match schema
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  spectatorCount: number;
  gameType: string;
  endTime?: Date;
}

export function OngoingGames() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    data: gamesData,
    isLoading,
    error,
  } = useGetData<IGame[]>("/api/games/active-games", ["ongoingGames"], {
    refetchInterval: 5000, // Refetch every 5 seconds
    retry: 3, // Retry failed requests 3 times
    onError: (error: Error) => {
      console.error("Failed to fetch games:", error);
    },
  });
  const games = gamesData?.data || [];

  const getGameTitle = (game: IGame) => {
    if (game.gameType === "AI_VS_AI") {
      return `AI vs AI`;
    } else if (game.gameType === "HUMAN_VS_AI") {
      return "Human vs AI";
    }
    return "Human vs Human";
  };

  const getGameIcon = (game: IGame) => {
    if (game.gameType === "AI_VS_AI") {
      return <Bot className="h-4 w-4 text-purple-400 mr-2" />;
    } else if (game.gameType === "HUMAN_VS_AI") {
      return <Bot className="h-4 w-4 text-blue-400 mr-2" />;
    }
    return <Monitor className="h-4 w-4 text-green-400 mr-2" />;
  };

  const getTimeRemaining = (endTime?: Date) => {
    if (!endTime) return "No time limit";

    const end = DateTime.fromJSDate(new Date(endTime));
    const now = DateTime.now();

    if (now > end) return "Time expired";

    const diff = end.diff(now, ["minutes", "seconds"]);
    return `${diff.minutes}m ${Math.floor(diff.seconds)}s`;
  };

  const getDifficultyLabel = (difficulty?: string) => {
    if (!difficulty) return null;

    const colors = {
      easy: "bg-green-900/40 text-green-400",
      medium: "bg-yellow-900/40 text-yellow-400",
      hard: "bg-red-900/40 text-red-400",
    };

    const color =
      colors[difficulty as keyof typeof colors] ||
      "bg-gray-800/40 text-gray-400";

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs ${color} capitalize`}>
        {difficulty}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-900/40 text-green-400 border-green-900/60",
      waiting: "bg-yellow-900/40 text-yellow-400 border-yellow-900/60",
      completed: "bg-gray-800/40 text-gray-400 border-gray-800/60",
      abandoned: "bg-red-900/40 text-red-400 border-red-900/60",
      draw: "bg-blue-900/40 text-blue-400 border-blue-900/60",
    };

    const color =
      colors[status as keyof typeof colors] ||
      "bg-gray-800/40 text-gray-400 border-gray-800/60";

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs border ${color} capitalize`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white p-6">
      {/* Background glow effects */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-700/10 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* Header with animated underline */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-300 hover:text-black rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-center relative group">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
              Ongoing Games
            </span>
            <span className="block h-1 max-w-0 group-hover:max-w-full transition-all duration-500 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500"></span>
          </h1>

          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-full shadow-lg shadow-amber-900/20 font-medium transition-all duration-300 transform hover:scale-105"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Start Game
          </Button>
        </div>
      </div>

      {/* Game List with enhanced cards */}
      <div className="max-w-6xl mx-auto">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading games...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-black/20 backdrop-blur-sm rounded-xl border border-red-800"
          >
            <div className="p-8">
              <p className="text-xl text-red-400 mb-6">
                Failed to load games. Please try again later.
              </p>
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-full px-6 shadow-lg shadow-amber-900/20"
                onClick={() => window.location.reload()}
              >
                <Plus className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          </motion.div>
        ) : games.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-800"
          >
            <div className="p-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                <Bot className="h-8 w-8 text-amber-400" />
              </div>
              <p className="text-xl text-gray-400 mb-6">
                No ongoing games available
              </p>
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-full px-6 shadow-lg shadow-amber-900/20"
                onClick={() => setIsModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Start a Game
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game, index) => (
              <motion.div
                key={game._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300"
              >
                {/* Card header with game type badge */}
                <div className="flex justify-between items-start p-4 border-b border-gray-800/50">
                  <div className="flex items-center">
                    {getGameIcon(game)}
                    <span className="px-2 py-1 bg-gray-800/80 rounded-full text-xs font-medium">
                      {getGameTitle(game)}
                    </span>
                  </div>
                  {getStatusBadge(game.status)}
                </div>

                {/* Game Info */}
                <div className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-white font-medium">
                        {game.whitePlayerUsername}
                      </div>
                      <div className="text-xs text-gray-400">vs</div>
                      <div className="text-sm text-white font-medium text-right">
                        {game.blackPlayerUsername}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            game.currentTurn === "w"
                              ? "bg-green-400"
                              : "bg-gray-600"
                          }`}
                        ></div>
                        <span className="text-gray-400">White</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Black</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            game.currentTurn === "b"
                              ? "bg-green-400"
                              : "bg-gray-600"
                          }`}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-amber-400" />
                        <span className="text-amber-300">
                          {getTimeRemaining(game.endTime)}
                        </span>
                      </div>
                      <div>{getDifficultyLabel(game.difficulty)}</div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-400">
                      <div>Moves: {game.moves.length}</div>
                      <div>Spectators: {game.spectatorCount}</div>
                    </div>
                  </div>
                </div>

                {/* Card footer with action button */}
                <div className="bg-black/40 p-4 flex justify-end items-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-400 border-amber-700/30 bg-black/30 hover:bg-amber-900/30 hover:text-amber-300 hover:border-amber-600 transition-all duration-300 rounded-full"
                    onClick={() => navigate(`/game/${game._id}`)}
                  >
                    <Eye className="mr-1 h-3 w-3" /> Watch
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating "Start Game" button for mobile */}
      <div className="md:hidden fixed bottom-6 right-6 z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            className="h-14 w-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-900/20"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>

      {/* Game Mode Modal */}
      <GameModeModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
