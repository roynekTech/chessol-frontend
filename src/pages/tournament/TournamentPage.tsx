import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  PlusCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Tournament form interface
interface TournamentForm {
  name: string;
  description: string;
  startDate: string;
  maxParticipants: string;
  timeControl: string;
  entryFee: string;
}

// Mock data for demonstration
const mockTournaments = [
  {
    id: 1,
    name: "Grand Chess Championship",
    description: "The ultimate chess showdown for chess lovers.",
    startDate: new Date(),
    participants: 32,
    maxParticipants: 64,
    status: "ongoing",
    prize: "5 SOL",
    timeControl: "5+3",
  },
  {
    id: 2,
    name: "Blitz Masters",
    description: "Fast-paced chess tournament for adrenaline seekers.",
    startDate: new Date(Date.now() + 86400000),
    participants: 16,
    maxParticipants: 16,
    status: "upcoming",
    prize: "2 SOL",
    timeControl: "3+2",
  },
];

// Mock bracket data
const mockBracket = {
  rounds: [
    {
      name: "Quarter Finals",
      matches: [
        { player1: "Alice", player2: "Bob", score: "1-0", winner: "Alice" },
        { player1: "Carol", player2: "Dave", score: "½-½", winner: null },
        { player1: "Eve", player2: "Frank", score: "0-1", winner: "Frank" },
        { player1: "Grace", player2: "Heidi", score: "1-0", winner: "Grace" },
      ],
    },
    {
      name: "Semi Finals",
      matches: [
        { player1: "Alice", player2: "Frank", score: "1-0", winner: "Alice" },
        { player1: "Grace", player2: "Carol", score: "0-1", winner: "Carol" },
      ],
    },
    {
      name: "Finals",
      matches: [
        { player1: "Alice", player2: "Carol", score: "?", winner: null },
      ],
    },
  ],
};

export function TournamentPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TournamentForm>({
    name: "",
    description: "",
    startDate: "",
    maxParticipants: "16",
    timeControl: "5+3",
    entryFee: "0",
  });
  const [tab, setTab] = useState<"list" | "bracket">("list");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement tournament creation logic
    setIsCreateDialogOpen(false);
  };
  const formatDate = (date: Date): string =>
    date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white relative">
      {/* Glassy hero section */}
      <div className="relative z-10 container mx-auto px-4 pt-10 pb-6 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl px-8 py-8 flex flex-col items-center w-full max-w-2xl border border-amber-400/20"
        >
          <Trophy className="w-14 h-14 text-amber-400 mb-2 drop-shadow-lg" />
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Chess Tournaments
          </h1>
          <p className="text-lg text-gray-200 mb-4 text-center max-w-xl">
            Compete, climb the bracket, and win prizes. Create or join a
            tournament now!
          </p>
          <Button
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-lg font-semibold px-6 py-2 rounded-full shadow-lg flex items-center gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <PlusCircle className="w-5 h-5" /> Create Tournament
          </Button>
        </motion.div>
      </div>

      {/* Tab Switcher */}
      <div className="relative z-10 container mx-auto px-4 flex justify-center mt-6 mb-2">
        <div className="flex bg-white/10 backdrop-blur rounded-full shadow border border-amber-400/20 overflow-hidden">
          <button
            className={`px-6 py-2 font-semibold transition-all ${
              tab === "list"
                ? "bg-amber-500/80 text-black shadow"
                : "text-white hover:bg-amber-400/20"
            }`}
            onClick={() => setTab("list")}
          >
            Tournaments
          </button>
          <button
            className={`px-6 py-2 font-semibold transition-all ${
              tab === "bracket"
                ? "bg-amber-500/80 text-black shadow"
                : "text-white hover:bg-amber-400/20"
            }`}
            onClick={() => setTab("bracket")}
          >
            Bracket
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 pb-16">
        {/* Tournament List */}
        {tab === "list" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-6"
          >
            {mockTournaments.map((tournament) => (
              <Card
                key={tournament.id}
                className="bg-white/10 backdrop-blur-lg border border-amber-400/20 rounded-2xl shadow-xl hover:scale-[1.025] transition-transform"
              >
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Trophy className="w-7 h-7 text-amber-400 drop-shadow" />
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                      {tournament.name}
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          tournament.status === "ongoing"
                            ? "bg-green-500/80 text-white"
                            : tournament.status === "upcoming"
                            ? "bg-blue-500/80 text-white"
                            : "bg-gray-500/80 text-white"
                        }`}
                      >
                        {tournament.status}
                      </span>
                    </CardTitle>
                    <CardDescription className="text-gray-200 text-sm mt-1">
                      {tournament.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Calendar className="w-4 h-4" />{" "}
                      {formatDate(tournament.startDate)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Users className="w-4 h-4" /> {tournament.participants}/
                      {tournament.maxParticipants} players
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Clock className="w-4 h-4" /> {tournament.timeControl}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-amber-400 font-semibold mt-2">
                      <Trophy className="w-4 h-4" /> Prize: {tournament.prize}
                    </div>
                  </div>
                  <div className="flex justify-end mt-6">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full px-4 py-1.5 font-semibold flex items-center gap-1"
                    >
                      Join <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Bracket Tree */}
        {tab === "bracket" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-y-auto mt-8 pb-8 flex flex-col items-center w-full"
          >
            <div className="flex flex-col gap-16 min-h-[700px] w-full max-w-5xl mx-auto">
              {/* Render rounds from top (final) to bottom (earliest) */}
              {mockBracket.rounds
                .slice()
                .reverse()
                .map((round, roundIdx, arr) => (
                  <div
                    key={round.name}
                    className="flex flex-col items-center w-full"
                  >
                    {/* Round label on top, centered */}
                    <h3 className="text-amber-400 font-bold text-lg mb-4 drop-shadow text-center w-full">
                      {round.name}
                    </h3>
                    <div
                      className={`flex flex-row gap-8 sm:gap-12 w-full justify-center relative`}
                    >
                      {round.matches.map((match, matchIdx) => (
                        <div
                          key={matchIdx}
                          className="relative flex flex-col items-center bg-white/10 backdrop-blur rounded-xl shadow-lg px-4 sm:px-6 py-4 min-w-[140px] sm:min-w-[180px] border border-amber-400/10 mx-auto"
                          style={{ flex: 1, maxWidth: 220 }}
                        >
                          {/* Trophy for winner */}
                          {match.winner && (
                            <Trophy className="absolute -top-7 left-1/2 -translate-x-1/2 w-7 h-7 text-amber-400 drop-shadow" />
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback>
                                {match.player1[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-white text-xs sm:text-base">
                              {match.player1}
                            </span>
                            <span className="text-amber-400 font-bold text-base sm:text-lg">
                              {match.score.split("-")[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarFallback>
                                {match.player2[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-white text-xs sm:text-base">
                              {match.player2}
                            </span>
                            <span className="text-amber-400 font-bold text-base sm:text-lg">
                              {match.score.split("-")[1]}
                            </span>
                          </div>
                          {/* Connector line to previous round */}
                          {roundIdx < arr.length - 1 && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-amber-400/30 rounded-full z-0" />
                          )}
                          {/* Connector lines to next round (fan out) */}
                          {roundIdx > 0 && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-amber-400/30 rounded-full z-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Tournament Modal */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white/10 backdrop-blur-lg border border-amber-400/20 text-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-amber-400 flex items-center gap-2">
              <PlusCircle className="w-6 h-6" /> Create Tournament
            </DialogTitle>
            <DialogDescription className="text-gray-200">
              Set up a new chess tournament. Fill in the details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tournament Name</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Grand Chess Championship"
                required
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tournament description..."
                required
                minLength={10}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Maximum Participants
              </label>
              <Select
                value={formData.maxParticipants}
                onValueChange={(value) =>
                  handleSelectChange("maxParticipants", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select max participants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">8 Players</SelectItem>
                  <SelectItem value="16">16 Players</SelectItem>
                  <SelectItem value="32">32 Players</SelectItem>
                  <SelectItem value="64">64 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Control</label>
              <Select
                value={formData.timeControl}
                onValueChange={(value) =>
                  handleSelectChange("timeControl", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time control" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1+0">1+0 (Bullet)</SelectItem>
                  <SelectItem value="3+2">3+2 (Blitz)</SelectItem>
                  <SelectItem value="5+3">5+3 (Blitz)</SelectItem>
                  <SelectItem value="10+5">10+5 (Rapid)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Entry Fee (SOL)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                name="entryFee"
                value={formData.entryFee}
                onChange={handleInputChange}
              />
              <p className="text-xs text-gray-400">
                Set to 0 for free tournaments
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-lg rounded-full mt-4"
            >
              Create Tournament
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-800/10 rounded-full filter blur-3xl" />
      </div>
    </div>
  );
}

export default TournamentPage;
