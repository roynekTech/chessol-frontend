import { FC, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Calendar,
  Link as LinkIcon,
  DollarSign,
  Star,
  Settings,
} from "lucide-react";
import { useTournamentDetails } from "../hooks/useTournamentHooks";
import { JoinTournamentModal } from "./JoinTournamentModal";
import { useWallet } from "@solana/wallet-adapter-react";

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

export const TournamentDetails: FC = () => {
  const { uniqueHash } = useParams();
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [joinOpen, setJoinOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useTournamentDetails(
    uniqueHash || ""
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-gray-200 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <p className="text-gray-400">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-gray-200 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-6 my-4 backdrop-blur-sm shadow-xl">
            <h3 className="text-xl font-semibold text-red-400 mb-2">Error</h3>
            <p className="text-gray-300 mb-4">
              {error instanceof Error ? error.message : "Tournament not found"}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
               Back to Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tournament = data.tournament;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black text-gray-200 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-amber-400 hover:text-amber-300 font-medium"
        >
           Back to Tournaments
        </button>
        <Card className="border-gray-800/70 backdrop-blur-md bg-gradient-to-b from-black/40 to-black/60 shadow-xl pt-0">
          <CardHeader className="border-b border-gray-800/50 bg-black/30 pt-8">
            <div className="flex items-center gap-3 min-w-0 flex-wrap">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-700/30 to-black/30 flex items-center justify-center border border-amber-800/50">
                <Trophy className="h-7 w-7 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <CardTitle className="text-2xl font-bold text-white truncate min-w-0 flex-1">
                    {tournament.name}
                  </CardTitle>
                  <Badge
                    className={`${getStatusColor(
                      tournament.status
                    )} border px-2 py-0.5 text-xs font-medium whitespace-nowrap shrink-0`}
                    variant="outline"
                  >
                    {tournament.status.charAt(0).toUpperCase() +
                      tournament.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400 mt-2">
                  {tournament.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-gray-300">
                  {new Date(tournament.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">Type:</span>
                <span className="text-gray-300 font-medium">
                  {tournament.type}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">Level:</span>
                <span className="text-gray-300 font-medium">
                  {tournament.level}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">ID:</span>
                <span className="text-gray-300 font-mono">
                  {tournament.tournmt_id}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">Hash:</span>
                <span className="text-gray-300 font-mono truncate">
                  {tournament.unique_hash}
                </span>
              </div>
              {tournament.link && (
                <div className="flex items-center">
                  <LinkIcon className="h-4 w-4 text-amber-400 mr-2" />
                  <a
                    href={tournament.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline truncate"
                  >
                    {tournament.link}
                  </a>
                </div>
              )}
              {/* Payment and Betting Info */}
              <div className="col-span-1 sm:col-span-2 mt-2 p-3 bg-gray-900/30 rounded-lg border border-gray-800/50">
                <div className="flex flex-wrap gap-4">
                  {typeof tournament.isBet !== "undefined" && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-400 mr-2" />
                      <span className="text-gray-400 mr-2">Betting:</span>
                      <span className="text-gray-300 font-medium">
                        {tournament.isBet ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                  {typeof tournament.configuration?.paymentAmount !==
                    "undefined" && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-amber-400 mr-2" />
                      <span className="text-gray-400 mr-2">Entry Fee:</span>
                      <span className="text-amber-400 font-semibold">
                        {tournament.configuration.paymentAmount} SOL
                      </span>
                    </div>
                  )}
                  {typeof tournament.starterScore !== "undefined" && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-2" />
                      <span className="text-gray-400 mr-2">Starter Score:</span>
                      <span className="text-gray-300 font-medium">
                        {tournament.starterScore}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Configuration */}
            {tournament.configuration && (
              <div className="mt-4 p-4 bg-gray-900/30 rounded-lg border border-gray-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300 font-semibold">
                    Tournament Configuration
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {tournament.configuration.mode && (
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">Mode:</span>
                      <span className="text-gray-300 font-medium capitalize">
                        {tournament.configuration.mode}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">Max Rounds:</span>
                    <span className="text-gray-300 font-medium">
                      {tournament.configuration.max_rounds}
                    </span>
                  </div>
                  {typeof tournament.configuration.randomStart !==
                    "undefined" && (
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">Random Start:</span>
                      <span className="text-gray-300 font-medium">
                        {tournament.configuration.randomStart ? "Yes" : "No"}
                      </span>
                    </div>
                  )}
                  {typeof tournament.configuration.moveTimeout !==
                    "undefined" && (
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">Move Timeout:</span>
                      <span className="text-gray-300 font-medium">
                        {tournament.configuration.moveTimeout} ms
                      </span>
                    </div>
                  )}
                  {typeof tournament.configuration.numberOfGames !==
                    "undefined" && (
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2">
                        Games per Round:
                      </span>
                      <span className="text-gray-300 font-medium">
                        {tournament.configuration.numberOfGames}
                      </span>
                    </div>
                  )}
                  {typeof tournament.configuration.resignationTime !==
                    "undefined" &&
                    tournament.configuration.resignationTime !== null && (
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">
                          Resignation Time:
                        </span>
                        <span className="text-gray-300 font-medium">
                          {tournament.configuration.resignationTime} ms
                        </span>
                      </div>
                    )}
                  {typeof tournament.configuration.abortTimeout !==
                    "undefined" &&
                    tournament.configuration.abortTimeout !== null && (
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-2">
                          Abort Timeout:
                        </span>
                        <span className="text-gray-300 font-medium">
                          {tournament.configuration.abortTimeout} ms
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}
            {/* Join Tournament Button */}
            {(() => {
              // No joined users logic, so just check if publicKey exists
              const canJoin =
                publicKey && ["upcoming", "active"].includes(tournament.status);
              return canJoin ? (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setJoinOpen(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-lg px-6 py-2 shadow-lg shadow-amber-900/10 transition-all duration-300"
                  >
                    Join Tournament
                  </button>
                  <JoinTournamentModal
                    tournament={tournament}
                    isOpen={joinOpen}
                    onClose={() => setJoinOpen(false)}
                    onSuccess={() => {
                      setJoinOpen(false);
                      refetch();
                    }}
                  />
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
