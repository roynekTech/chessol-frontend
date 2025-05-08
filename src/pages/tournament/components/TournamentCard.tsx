import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ITournament } from "../types";
import { helperUtil } from "@/utils/helper";
import { Badge } from "@/components/ui/badge";
import { JoinTournamentModal } from "./JoinTournamentModal";
import { Calendar, Trophy, Users, ArrowRight, DollarSign } from "lucide-react";

interface TournamentCardProps {
  tournament: ITournament;
  onJoinSuccess?: () => void;
}

export const TournamentCard: FC<TournamentCardProps> = ({
  tournament,
  onJoinSuccess,
}) => {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const [joinModalOpen, setJoinModalOpen] = useState(false);

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

  const handleViewDetails = () => {
    navigate(`/tournaments/${tournament.unique_hash}`);
  };

  return (
    <>
      <Card className="w-full h-full overflow-hidden backdrop-blur-md bg-gradient-to-b from-black/40 to-black/60 border border-gray-800/70 hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 rounded-xl">
        <CardHeader className="relative pb-2">
          <div className="absolute top-3 right-3 z-10">
            <Badge
              className={`${getStatusColor(
                tournament.status
              )} border px-2 py-0.5 text-xs font-medium`}
              variant="outline"
            >
              {tournament.status.charAt(0).toUpperCase() +
                tournament.status.slice(1)}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-700/30 to-black/30 flex items-center justify-center border border-amber-800/50">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-white mb-1">
                {tournament.name}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-gray-400">
                {tournament.description || "No description provided"}
              </CardDescription>
            </div>
          </div>

          {tournament.isBet === 1 && (
            <div className="mt-2">
              <Badge
                className="bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded-full text-xs border border-purple-700/30"
                variant="outline"
              >
                <DollarSign className="h-3 w-3 mr-1" /> Betting Tournament
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3 pb-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 text-blue-400 mr-2" />
              <span className="text-gray-300">
                {helperUtil.formatDate(tournament.date)}
              </span>
            </div>

            <div className="flex items-center text-sm">
              <Users className="h-4 w-4 text-purple-400 mr-2" />
              <span className="text-gray-300">
                {tournament.wallets
                  ? Object.keys(tournament.wallets).length
                  : 0}{" "}
                / {tournament.totalPlayers || "∞"}
              </span>
            </div>

            <div className="flex items-center text-sm">
              <Trophy className="h-4 w-4 text-amber-400 mr-2" />
              <span className="text-gray-300 capitalize">
                {tournament.configuration?.mode || "standard"}
              </span>
            </div>

            {tournament.isBet === 1 && tournament.paymentAmount && (
              <div className="flex items-center text-sm">
                <DollarSign className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-gray-300">
                  {tournament.paymentAmount} SOL
                </span>
              </div>
            )}
          </div>

          {/* Tournament details */}
          <div className="bg-black/20 rounded-lg p-3 border border-gray-800/40">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Rounds:</span>
              <span>{tournament.configuration?.max_rounds || "N/A"}</span>
            </div>
            {tournament.configuration?.moveTimeout && (
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Move Timeout:</span>
                <span>{tournament.configuration.moveTimeout} sec</span>
              </div>
            )}
            {tournament.scoring && (
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Scoring:</span>
                <span>
                  W:{tournament.scoring.win} D:{tournament.scoring.draw} L:
                  {tournament.scoring.loss}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between pt-2 gap-2">
          <Button
            variant="outline"
            onClick={handleViewDetails}
            className="flex-1 border-gray-700/50 text-black hover:bg-gray-800/50 hover:text-white"
          >
            Details
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button
            onClick={() => setJoinModalOpen(true)}
            disabled={!publicKey || tournament.status === "completed"}
            variant={tournament.status === "active" ? "default" : "secondary"}
            className={`flex-1 ${
              tournament.status === "active"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                : "bg-purple-900/30 text-purple-300 hover:bg-purple-800/40 hover:text-white"
            }`}
          >
            Join Tournament
          </Button>
        </CardFooter>
      </Card>

      <JoinTournamentModal
        tournament={tournament}
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSuccess={() => {
          setJoinModalOpen(false);
          if (onJoinSuccess) onJoinSuccess();
        }}
      />
    </>
  );
};
