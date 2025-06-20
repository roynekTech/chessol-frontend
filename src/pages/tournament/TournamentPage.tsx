import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Calendar,
  Users,
  ArrowLeft,
  RefreshCw,
  Plus,
} from "lucide-react";
import { CreateTournamentForm } from "./components/CreateTournamentForm";
import { TournamentDetails } from "./components/TournamentDetails";
import { TournamentCard } from "./components/TournamentCard";
import { ITournament } from "./types";
import { useTournaments } from "./hooks/useTournamentHooks";

export function TournamentPage() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const { uniqueHash } = useParams<{ uniqueHash?: string }>();
  const [tournaments, setTournaments] = useState<{
    active: ITournament[];
    upcoming: ITournament[];
    completed: ITournament[];
  }>({
    active: [],
    upcoming: [],
    completed: [],
  });
  const [activeTab, setActiveTab] = useState<string>("browse");

  // Use TanStack Query to fetch tournaments
  const {
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
    data,
  } = useTournaments();

  // Process tournaments on successful fetch
  useEffect(() => {
    if (!loading && !isError && data?.tournaments) {
      const active: ITournament[] = [];
      const upcoming: ITournament[] = [];
      const completed: ITournament[] = [];

      data.tournaments.forEach((tournament: ITournament) => {
        switch (tournament.status) {
          case "active":
            active.push(tournament);
            break;
          case "upcoming":
            upcoming.push(tournament);
            break;
          case "completed":
            completed.push(tournament);
            break;
        }
      });

      setTournaments({ active, upcoming, completed });
    }
  }, [data, loading, isError]);

  // Extract error message from query error
  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "An unknown error occurred"
    : null;

  const refreshTournaments = () => {
    refetch();
  };

  if (uniqueHash) {
    return <TournamentDetails uniqueHash={uniqueHash} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-gray-200 p-6">
      {/* Background glow effects */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-800/5 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* Header with animated underline */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Back to home button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-black rounded-full px-4 cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-center relative group">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
              Tournaments
            </span>
            <span className="block h-0.5 max-w-0 group-hover:max-w-full transition-all duration-500 bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500"></span>
          </h1>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={refreshTournaments}
              disabled={loading}
              className="text-amber-400 border-amber-700/30 bg-black/30 hover:bg-amber-900/30 hover:text-amber-300 hover:border-amber-600 transition-all duration-300 rounded-full shadow-sm shadow-amber-900/10"
            >
              <RefreshCw
                className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {publicKey && (
              <Button
                onClick={() => setActiveTab("create")}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-full shadow-lg shadow-amber-900/20 font-medium transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="mr-1 h-4 w-4" /> Create Tournament
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Description Panel */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-black/40 to-purple-900/10 backdrop-blur-sm rounded-xl border border-gray-800/40 p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
            <div className="bg-gradient-to-br from-amber-600/20 to-purple-600/20 p-3 rounded-lg">
              <Trophy className="h-10 w-10 text-amber-400/80" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-amber-300 mb-2">
                Compete in Chess Tournaments
              </h2>
              <p className="text-gray-300 mb-4 max-w-3xl">
                Join tournaments with players from around the world. Compete for
                prizes, improve your skills, and climb the rankings. Tournaments
                are available in various formats including Swiss, Round Robin,
                and Knockout stages.
              </p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-black/30 border border-amber-700/30 flex items-center justify-center mr-2">
                    <Trophy className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-gray-300">
                    Win prizes and recognition
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-black/30 border border-amber-700/30 flex items-center justify-center mr-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-gray-300">
                    Regular scheduled events
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-black/30 border border-amber-700/30 flex items-center justify-center mr-2">
                    <Users className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-gray-300">
                    Play with diverse opponents
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full max-w-6xl mx-auto"
      >
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-8 bg-black/30 border border-gray-800/50 p-1 rounded-full">
          <TabsTrigger
            value="browse"
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/80 data-[state=active]:to-orange-600/80 text-white cursor-pointer"
          >
            Browse Tournaments
          </TabsTrigger>
          <TabsTrigger
            value="create"
            disabled={!publicKey}
            className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/80 data-[state=active]:to-orange-600/80 text-white cursor-pointer"
          >
            Create Tournament
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/20 border border-red-800/40 rounded-xl p-6 my-4 backdrop-blur-sm"
            >
              <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <Button
                onClick={refreshTournaments}
                variant="outline"
                className="border-red-700/30 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <RefreshCw className="mr-1 h-4 w-4" /> Retry
              </Button>
            </motion.div>
          )}

          {loading &&
          tournaments.active.length === 0 &&
          tournaments.upcoming.length === 0 &&
          tournaments.completed.length === 0 ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
                <p className="text-gray-400">Loading tournaments...</p>
              </div>
            </div>
          ) : (
            <>
              {tournaments.active.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-400" />
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
                        Active Tournaments
                      </h2>
                    </div>
                    <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.active.map((tournament, index) => (
                      <motion.div
                        key={tournament.unique_hash}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <TournamentCard tournament={tournament} />
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}

              {tournaments.upcoming.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                        Upcoming Tournaments
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.upcoming.map((tournament, index) => (
                      <motion.div
                        key={tournament.unique_hash}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <TournamentCard tournament={tournament} />
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}

              {tournaments.completed.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-gray-400" />
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                        Completed Tournaments
                      </h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.completed.map((tournament, index) => (
                      <motion.div
                        key={tournament.unique_hash}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <TournamentCard tournament={tournament} />
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}

              {tournaments.active.length === 0 &&
                tournaments.upcoming.length === 0 &&
                tournaments.completed.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16 bg-gradient-to-r from-black/40 to-purple-900/10 rounded-xl border border-gray-800/40 backdrop-blur-sm shadow-xl"
                  >
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-700/20 to-black/30 flex items-center justify-center border border-purple-800/50">
                      <Trophy className="h-8 w-8 text-purple-400/70" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">
                      No tournaments available
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      There are currently no tournaments scheduled. Why not
                      create one and invite players to join?
                    </p>
                    {publicKey ? (
                      <Button
                        onClick={() => setActiveTab("create")}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-full px-6 py-2 shadow-lg shadow-amber-900/20"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Create Tournament
                      </Button>
                    ) : (
                      <p className="text-sm text-gray-500 border border-gray-800/40 rounded-lg px-4 py-2 bg-black/20 inline-block">
                        Connect your wallet to create a tournament
                      </p>
                    )}
                  </motion.div>
                )}
            </>
          )}
        </TabsContent>

        <TabsContent value="create">
          {!publicKey ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-gradient-to-r from-black/40 to-purple-900/10 rounded-xl border border-gray-800/40 backdrop-blur-sm shadow-xl"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-700/20 to-black/30 flex items-center justify-center border border-amber-800/50">
                <Trophy className="h-8 w-8 text-amber-400/70" />
              </div>
              <h3 className="text-xl font-semibold text-amber-300 mb-2">
                Connect your wallet
              </h3>
              <p className="text-gray-400 max-w-md mx-auto">
                You need to connect your Solana wallet to create and manage
                tournaments. This allows us to verify your identity and secure
                your tournament entries.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CreateTournamentForm />
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
