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
  Gamepad2,
  Trophy,
  Plus,
  Search,
} from "lucide-react";
import { GameModeModal } from "@/components/GameModeModal";
import { JoinGameModal } from "@/components/JoinGameModal";
import { IListGamesResponse, LocalStorageRoomTypeEnum } from "../utils/type";
import { API_PATHS, PAGE_ROUTES } from "../utils/constants";
import { useGetData } from "../utils/use-query-hooks";
import { helperUtil } from "../utils/helper";
import { useChessGameStore } from "../stores/chessGameStore";

export function OngoingGames() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const updateGameState = useChessGameStore((state) => state.updateGameState);
  const deleteGameState = useChessGameStore((state) => state.deleteGameState);

  const { data: gamesData, isLoading: isLoadingGames } = useGetData<{
    data: IListGamesResponse[];
  }>(API_PATHS.listGames(), ["ongoingGames"], {
    refetchInterval: 3 * 60 * 1000, // 3 minutes
  });
  const games = gamesData?.data || [];

  const getTimeRemaining = (
    duration: number,
    time_difference: number | null
  ) => {
    if (!duration || time_difference === null) {
      return "No time limit";
    }
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

  const handleSpectateGame = (gameId: string) => {
    deleteGameState();
    updateGameState({
      gameId: gameId,
      roomType: LocalStorageRoomTypeEnum.SPECTATOR,
    });
    navigate(PAGE_ROUTES.GamePlay);
  };

  const navigateToTournaments = () => {
    navigate(PAGE_ROUTES.TournamentPage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-gray-200 p-6">
      {/* Background glow effects - subtle adjustments */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-800/5 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* Header with action buttons */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-black rounded-full px-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-center relative group">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
              Chess Arena
            </span>
            <span className="block h-0.5 max-w-0 group-hover:max-w-full transition-all duration-500 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500"></span>
          </h1>

          <div className="opacity-0 w-[88px]">
            {/* Empty div for flex alignment */}
          </div>
        </div>
      </div>

      {/* Game options and tournament navigation */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Create Game Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gradient-to-b from-amber-950/20 to-black/40 backdrop-blur-sm border border-amber-700/30 rounded-xl overflow-hidden hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 group"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="p-6 flex flex-col items-center text-center cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-800/40 flex items-center justify-center border border-amber-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-7 w-7 text-amber-400 group-hover:text-amber-300" />
              </div>
              <h3 className="text-xl font-semibold text-amber-300 mb-2">
                Create Game
              </h3>
              <p className="text-sm text-gray-400">
                Start a new chess match with custom settings
              </p>
            </div>
          </motion.div>

          {/* Join Game Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-gradient-to-b from-purple-950/20 to-black/40 backdrop-blur-sm border border-purple-700/30 rounded-xl overflow-hidden hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300 group"
            onClick={() => setIsJoinModalOpen(true)}
          >
            <div className="p-6 flex flex-col items-center text-center cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-800/40 flex items-center justify-center border border-purple-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Search className="h-7 w-7 text-purple-400 group-hover:text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold text-purple-300 mb-2">
                Join Game
              </h3>
              <p className="text-sm text-gray-400">
                Enter a game ID to join an existing match
              </p>
            </div>
          </motion.div>

          {/* Tournament Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-gradient-to-b from-blue-950/20 to-black/40 backdrop-blur-sm border border-blue-700/30 rounded-xl overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-300 group"
            onClick={navigateToTournaments}
          >
            <div className="p-6 flex flex-col items-center text-center cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-800/40 flex items-center justify-center border border-blue-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-7 w-7 text-blue-400 group-hover:text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold text-blue-300 mb-2">
                Tournaments
              </h3>
              <p className="text-sm text-gray-400">
                Join competitive tournaments and win prizes
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ongoing Games Section */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-100 border-b border-gray-800 pb-4 flex items-center">
          <Gamepad2 className="mr-3 h-5 w-5 text-amber-400" />
          <span>Ongoing Games</span>
        </h2>

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
                className="bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-md border border-gray-800/70 rounded-xl overflow-hidden hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300"
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

                  {/* Meta Info + Spectate Button */}
                  <div className="flex flex-col gap-2 mt-3 border-t border-gray-800/50 pt-3">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                      {/* Time remaining */}
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-amber-500" />
                        <span>
                          {getTimeRemaining(
                            game.duration,
                            game.time_difference
                          )}
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
                        <span>{game?.spectator_count || 0}</span>
                      </div>
                    </div>
                    {/* Spectate Button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mx-auto mt-2 px-6 py-2 font-semibold rounded-lg bg-black/30 border border-amber-500/40 text-amber-300 shadow-sm shadow-amber-900/10 transition-all duration-200 hover:bg-amber-900/20 hover:text-white hover:border-amber-400 focus:ring-2 focus:ring-amber-400 focus:outline-none w-auto cursor-pointer"
                      aria-label="Spectate this game"
                      onClick={() => handleSpectateGame(game.game_hash)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Spectate
                    </Button>
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
