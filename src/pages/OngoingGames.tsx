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
  Clock,
  Users,
  Gamepad2,
} from "lucide-react";
import { GameModeModal } from "@/components/GameModeModal";
import { JoinGameModal } from "@/components/JoinGameModal";
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
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const gamesData: { data: IGame[] } = { data: [] };
  const games = gamesData?.data || [];
  const isLoading = false; // Replace with actual loading state
  const error = false; // Replace with actual error state

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
      <span
        className={`px-2 py-0.5 rounded-full text-xs ${color} capitalize border border-transparent`}
      >
        {difficulty}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const baseStyle = "px-2 py-0.5 rounded-full text-xs border capitalize";
    const colors = {
      active: "border-green-700/50 bg-green-900/30 text-green-400",
      waiting: "border-yellow-700/50 bg-yellow-900/30 text-yellow-400",
      completed: "border-gray-700/50 bg-gray-900/30 text-gray-400",
      abandoned: "border-red-700/50 bg-red-900/30 text-red-400",
      draw: "border-blue-700/50 bg-blue-900/30 text-blue-400",
    };
    const color =
      colors[status as keyof typeof colors] ||
      "border-gray-700/50 bg-gray-900/30 text-gray-400";

    return <span className={`${baseStyle} ${color}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-gray-200 p-6">
      {/* Background glow effects - subtle adjustments */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-800/5 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* Header with animated underline and new buttons */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Back to home button - simplified style */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-black rounded-full px-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-center relative group">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
              Ongoing Games
            </span>
            <span className="block h-0.5 max-w-0 group-hover:max-w-full transition-all duration-500 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500"></span>
          </h1>

          {/* New Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="text-amber-400 border-amber-700/30 bg-black/30 hover:bg-amber-900/30 hover:text-amber-300 hover:border-amber-600 transition-all duration-300 rounded-full shadow-sm shadow-amber-900/10"
              onClick={() => {
                setIsJoinModalOpen(true);
              }}
            >
              <Users className="mr-2 h-4 w-4" /> Join Game
            </Button>
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-full shadow-lg shadow-amber-900/20 font-medium transition-all duration-300 transform hover:scale-105"
              onClick={() => setIsModalOpen(true)}
            >
              <Gamepad2 className="mr-2 h-4 w-4" /> Create Game
            </Button>
          </div>
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
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-700/20 to-black/30 flex items-center justify-center border border-purple-800/50">
                <Gamepad2 className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-xl text-gray-400 mb-6">
                No ongoing games found.
              </p>
              <Button
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-full px-6 shadow-lg shadow-amber-900/20"
                onClick={() => setIsModalOpen(true)}
              >
                <Gamepad2 className="mr-2 h-4 w-4" /> Create a Game
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
                className="bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-md border border-gray-800/70 rounded-xl overflow-hidden hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/game/${game._id}`)}
              >
                {/* Card header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-800/50">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    {getGameIcon(game)}
                    <span>{getGameTitle(game)}</span>
                  </div>
                  {getStatusBadge(game.status)}
                </div>

                {/* Game Info */}
                <div className="p-4 space-y-3">
                  {/* Player names */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-100 truncate">
                      {game.whitePlayerUsername}
                    </span>
                    <span className="text-xs text-gray-500 px-2">vs</span>
                    <span className="font-medium text-gray-100 truncate text-right">
                      {game.blackPlayerUsername}
                    </span>
                  </div>

                  {/* Turn Indicator - Simplified */}
                  <div className="flex items-center justify-center text-xs text-gray-400">
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                        game.currentTurn === "w"
                          ? "bg-green-400 animate-pulse"
                          : "bg-gray-600"
                      }`}
                    ></span>
                    {game.currentTurn === "w" ? "White" : "Black"}
                    's turn
                  </div>

                  {/* Meta Info */}
                  <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-800/50 pt-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span>{getTimeRemaining(game.endTime)}</span>
                    </div>
                    {getDifficultyLabel(game.difficulty)}
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3" />
                      <span>{game.spectatorCount}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Game Mode Modal */}
      <GameModeModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <JoinGameModal open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen} />
    </div>
  );
}
