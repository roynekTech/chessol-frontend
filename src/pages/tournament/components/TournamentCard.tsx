import { FC } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TournamentCardProps {
  tournament: {
    tournmt_id: number;
    name: string;
    type: string;
    level: number;
    unique_hash: string;
    date: string;
    description: string;
    status: "upcoming" | "active" | "completed";
  };
}

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

export const TournamentCard: FC<TournamentCardProps> = ({ tournament }) => {
  const navigate = useNavigate();

  return (
    <Card className="w-full h-full overflow-hidden backdrop-blur-md bg-gradient-to-b from-black/40 to-black/60 border border-gray-800/70 hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 rounded-xl flex flex-col">
      <CardHeader className="relative pb-2">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-700/30 to-black/30 flex items-center justify-center border border-amber-800/50">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <CardTitle className="text-xl font-bold text-white mb-1 truncate min-w-0 flex-1">
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
            <CardDescription className="line-clamp-2 text-gray-400 break-words">
              {tournament.description || "No description provided"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-2 flex-1 flex flex-col justify-end">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
            <span className="text-gray-300 font-medium">{tournament.type}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 mr-2">Level:</span>
            <span className="text-gray-300 font-medium">
              {tournament.level}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-2 gap-2">
        <button
          onClick={() => navigate(`/tournaments/${tournament.unique_hash}`)}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-lg py-2 transition-all duration-300"
        >
          View Details
        </button>
      </CardFooter>
    </Card>
  );
};
