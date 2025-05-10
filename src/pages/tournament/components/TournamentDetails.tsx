import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { helperUtil } from "@/utils/helper";
import { JoinTournamentModal } from "./JoinTournamentModal";
import { useTournamentDetails } from "../hooks/useTournamentHooks";
import {
  ArrowLeft,
  Trophy,
  Calendar,
  Users,
  Copy,
  ExternalLink,
  Twitter,
  Clock,
  DollarSign,
} from "lucide-react";
import { ScoreManager } from "./ScoreManager";

interface TournamentDetailsProps {
  uniqueHash: string;
}

export const TournamentDetails: FC<TournamentDetailsProps> = ({
  uniqueHash,
}) => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [isAdminView, setIsAdminView] = useState(true);

  // TODO: IMPLEMENT ADMIN VIEW
  useEffect(() => {
    setIsAdminView(true);
  }, []);

  // Use our custom hook for fetching tournament details
  const {
    data: tournamentData,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useTournamentDetails(uniqueHash);

  // Extract tournament data and error message
  const tournament = tournamentData?.tournament || null;
  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "An unknown error occurred"
    : null;

  const isPlayerJoined = () => {
    if (!publicKey || !tournament?.wallets) return false;
    return Object.keys(tournament.wallets).includes(publicKey.toString());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "border-green-700/50 bg-green-900/30 text-green-400";
      case "upcoming":
        return "border-blue-700/50 bg-blue-900/30 text-blue-400";
      case "completed":
        return "border-gray-700/50 bg-gray-900/30 text-gray-400";
      default:
        return "border-gray-700/50 bg-gray-900/30 text-gray-400";
    }
  };

  const handleScoreUpdated = () => {
    if (uniqueHash) {
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-gray-200 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <p className="text-gray-400">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-gray-200 p-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900/20 border border-red-800/40 rounded-xl p-6 my-4 backdrop-blur-sm shadow-xl"
          >
            <h3 className="text-xl font-semibold text-red-400 mb-2">Error</h3>
            <p className="text-gray-300 mb-4">
              {error || "Tournament not found"}
            </p>
            <Button
              onClick={() => navigate("/tournaments")}
              variant="outline"
              className="border-red-700/30 text-red-400 hover:text-red-300 hover:bg-red-900/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tournaments
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-gray-200 p-6">
        {/* Background glow effects */}
        <div className="fixed top-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-800/5 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* Back navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/tournaments")}
              className="text-gray-400 hover:text-black rounded-full px-4 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tournaments
            </Button>
          </motion.div>

          {/* Tournament header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row justify-between gap-6 bg-gradient-to-r from-black/40 to-purple-900/10 backdrop-blur-sm rounded-xl border border-gray-800/40 p-6 shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-amber-700/30 to-black/30 flex items-center justify-center border border-amber-800/50 flex-shrink-0">
                  <Trophy className="h-7 w-7 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center flex-wrap gap-3 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
                      {tournament.name}
                    </h1>
                    <Badge
                      className={`${getStatusColor(tournament.status)} border`}
                    >
                      {tournament.status.charAt(0).toUpperCase() +
                        tournament.status.slice(1)}
                    </Badge>
                    {tournament.isBet === 1 && (
                      <Badge className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full text-xs border border-purple-700/30">
                        <DollarSign className="h-3 w-3 mr-1" /> Betting
                        Tournament
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-gray-300 mb-2">
                    {tournament.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span>Date: {helperUtil.formatDate(tournament.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  <span>
                    Players:{" "}
                    <span className="text-gray-300 font-medium">
                      {tournament.wallets
                        ? Object.keys(tournament.wallets).length
                        : 0}{" "}
                      / {tournament.totalPlayers || "∞"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span>
                    Mode:{" "}
                    <span className="text-gray-300 font-medium capitalize">
                      {tournament.configuration?.mode || "standard"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-400" />
                  <span>
                    Rounds:{" "}
                    <span className="text-gray-300 font-medium">
                      {tournament.configuration?.max_rounds || 5}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4 md:mt-0">
              <Button
                onClick={() => setJoinModalOpen(true)}
                disabled={
                  !publicKey ||
                  tournament.status === "completed" ||
                  isPlayerJoined()
                }
                size="lg"
                className={
                  isPlayerJoined()
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium"
                    : tournament.status === "completed"
                    ? "bg-gray-700/50 text-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium"
                }
              >
                {isPlayerJoined()
                  ? "Already Joined"
                  : tournament.status === "completed"
                  ? "Tournament Ended"
                  : "Join Tournament"}
              </Button>
              {tournament.link && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(tournament.link, "_blank")}
                  className="border-gray-700/50 text-black hover:bg-gray-800/40 hover:text-white"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Tournament Website
                </Button>
              )}
            </div>
          </motion.div>

          {/* Tournament content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Players section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="md:col-span-2"
            >
              <Card className="border-gray-800/50 backdrop-blur-md bg-gradient-to-b from-black/40 to-black/60 rounded-xl overflow-hidden shadow-xl pt-0">
                <CardHeader className="bg-black/30 border-b border-gray-800/50 pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-400" />
                    <CardTitle className="text-xl font-bold text-white">
                      Players
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    Tournament participants and current standings
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {tournament.wallets &&
                  Object.keys(tournament.wallets).length > 0 ? (
                    <div className="divide-y divide-gray-800/50">
                      {Object.entries(tournament.wallets).map(
                        ([wallet, player], index) => {
                          const score =
                            tournament.scoring?.[wallet] ??
                            tournament.starterScore ??
                            0;
                          return (
                            <motion.div
                              key={wallet}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.3,
                                delay: index * 0.05,
                              }}
                              className="py-4 px-6 flex justify-between items-center hover:bg-gray-900/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold
                                  ${
                                    index === 0
                                      ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white"
                                      : index === 1
                                      ? "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-900"
                                      : index === 2
                                      ? "bg-gradient-to-r from-amber-700 to-amber-800 text-amber-300"
                                      : "bg-gray-900 text-gray-300 border border-gray-700"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-200">
                                    {player.nickname || `Player ${index + 1}`}
                                  </div>
                                  <div className="text-xs text-gray-400 truncate max-w-[200px]">
                                    {wallet}
                                  </div>
                                </div>
                              </div>
                              <div className="font-semibold bg-black/30 px-3 py-1 rounded-full border border-gray-800/50 text-amber-400">
                                {score} points
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                      <Users className="h-12 w-12 text-gray-700 mb-4" />
                      <p className="text-center">
                        No players have joined this tournament yet.
                      </p>
                      {publicKey &&
                        !isPlayerJoined() &&
                        tournament.status !== "completed" && (
                          <Button
                            onClick={() => setJoinModalOpen(true)}
                            variant="outline"
                            className="mt-4 border-gray-700 text-black hover:bg-gray-800/40 hover:text-white cursor-pointer"
                          >
                            Be the first to join
                          </Button>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Tournament rules & details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="border-gray-800/50 backdrop-blur-md bg-gradient-to-b from-black/40 to-black/60 rounded-xl overflow-hidden shadow-xl h-full pt-0">
                <CardHeader className="bg-black/30 border-b border-gray-800/50 pt-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    <CardTitle className="text-xl font-bold text-white">
                      Tournament Rules
                    </CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    Game configuration and scoring system
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 py-6">
                  <div className="bg-black/20 rounded-lg p-4 border border-gray-800/40">
                    <h4 className="font-semibold mb-3 text-amber-400 flex items-center gap-2">
                      <Trophy className="h-4 w-4" /> Game Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Mode:</span>
                        <span className="text-gray-300 font-medium capitalize">
                          {tournament.configuration?.mode || "standard"}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Rounds:</span>
                        <span className="text-gray-300 font-medium">
                          {tournament.configuration?.max_rounds || 5}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Move timeout:</span>
                        <span className="text-gray-300 font-medium">
                          {(tournament.configuration?.moveTimeout || 30000) /
                            1000}
                          s
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Random start:</span>
                        <span className="text-gray-300 font-medium">
                          {tournament.configuration?.randomStart ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-lg p-4 border border-gray-800/40">
                    <h4 className="font-semibold mb-3 text-blue-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Scoring System
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Win:</span>
                        <span className="text-gray-300 font-medium">
                          {tournament.scoring?.win || 3} points
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Draw:</span>
                        <span className="text-gray-300 font-medium">
                          {tournament.scoring?.draw || 1} points
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Loss:</span>
                        <span className="text-gray-300 font-medium">
                          {tournament.scoring?.loss || 0} points
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Starting score:</span>
                        <span className="text-gray-300 font-medium">
                          {tournament.starterScore || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {tournament.isBet === 1 && tournament.paymentAmount && (
                    <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-900/30">
                      <h4 className="font-semibold mb-3 text-purple-400 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> Betting Information
                      </h4>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Entry fee:</span>
                          <span className="text-purple-300 font-medium">
                            {tournament.paymentAmount} SOL
                          </span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Prize pool:</span>
                          <span className="text-purple-300 font-medium">
                            {tournament.wallets
                              ? (
                                  Object.keys(tournament.wallets).length *
                                  tournament.paymentAmount
                                ).toFixed(2)
                              : 0}{" "}
                            SOL
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t border-gray-800/50 flex-col items-start gap-2 px-6 py-4 bg-black/20">
                  {tournament.socals && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-300 hover:text-blue-400 hover:bg-blue-900/10"
                      onClick={() => window.open(tournament.socals, "_blank")}
                    >
                      <Twitter className="w-4 h-4 mr-2 text-blue-400" />
                      Follow on Twitter
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-300 hover:text-amber-400 hover:bg-amber-900/10"
                    onClick={() => {
                      navigator.clipboard.writeText(tournament.unique_hash);
                      // TODO: Add toast notification
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2 text-amber-400" />
                    Copy Tournament ID
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Score Management Section */}
            {isAdminView && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="col-span-1 md:col-span-3 mt-6"
              >
                <ScoreManager
                  tournament={tournament}
                  onScoreUpdated={handleScoreUpdated}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <JoinTournamentModal
        tournament={tournament}
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => {
          setJoinModalOpen(false);
          window.location.reload();
        }}
      />
    </>
  );
};
