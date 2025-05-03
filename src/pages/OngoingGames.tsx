import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Bot,
  Monitor,
  Clock,
  Users,
  Gamepad2,
} from "lucide-react";
import { GameModeModal } from "@/components/GameModeModal";
import { JoinGameModal } from "@/components/JoinGameModal";
import { IListGamesResponse } from "../utils/type";
import { API_PATHS } from "../utils/constants";
import { useGetData } from "../utils/use-query-hooks";
import { helperUtil } from "../utils/helper";

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

  const { data: gamesData, isLoading: isLoadingGames } = useGetData<{
    data: IListGamesResponse[];
  }>(API_PATHS.listGames(), ["ongoingGames"], {
    refetchInterval: 3 * 60 * 1000, // 3 minutes
  });
  const games = gamesData?.data || [];
  console.log("games", games);

  const getTimeRemaining = (
    duration: number,
    time_difference: number | null
  ) => {
    if (!duration || time_difference === null) return "No time limit";
    // duration is in ms, time_difference in ms
    const remaining = duration - time_difference;
    if (remaining <= 0) return "Time expired";
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getStatusBadge = (game_state: string) => {
    const baseStyle = "px-2 py-0.5 rounded-full text-xs border capitalize";
    const colors: Record<string, string> = {
      active: "border-green-700/50 bg-green-900/30 text-green-400",
      waiting: "border-yellow-700/50 bg-yellow-900/30 text-yellow-400",
      completed: "border-gray-700/50 bg-gray-900/30 text-gray-400",
      abandoned: "border-red-700/50 bg-red-900/30 text-red-400",
      draw: "border-blue-700/50 bg-blue-900/30 text-blue-400",
    };
    const color =
      colors[game_state] || "border-gray-700/50 bg-gray-900/30 text-gray-400";
    return <span className={`${baseStyle} ${color}`}>{game_state}</span>;
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
        {isLoadingGames ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading games...</p>
          </div>
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
                key={game.game_hash}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-md border border-gray-800/70 rounded-xl overflow-hidden hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(`/game/${game.game_hash}`)}
              >
                {/* Card header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-800/50">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    {/* Icon: show betting or normal */}
                    {game.bet_status === 1 ? (
                      <Bot className="h-4 w-4 text-purple-400 mr-2" />
                    ) : (
                      <Monitor className="h-4 w-4 text-green-400 mr-2" />
                    )}
                    <span>
                      {game.bet_status === 1 ? "Betting Game" : "Normal Game"}
                    </span>
                  </div>
                  {getStatusBadge(game.game_state)}
                </div>

                {/* Game Info */}
                <div className="p-4 space-y-3">
                  {/* Player names */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-100 truncate">
                      {helperUtil.shortenWalletAddress(game.player1)}
                    </span>
                    <span className="text-xs text-gray-500 px-2">vs</span>
                    <span className="font-medium text-gray-100 truncate text-right">
                      {helperUtil.shortenWalletAddress(game.player2)}
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-800/50 pt-3 mt-3">
                    {/* Time remaining */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span>
                        {getTimeRemaining(game.duration, game.time_difference)}
                      </span>
                    </div>
                    {/* Bet Amount */}
                    {game.bet_status === 1 && (
                      <span className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full text-xs border border-purple-700/30">
                        Bet: {game.player_amount} SOL
                      </span>
                    )}

                    {/* Spectator Count */}
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3 w-3" />
                      <span>{game?.spectator_count || 0}</span>{" "}
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
