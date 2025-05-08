import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ICreateTournamentRequest } from "../types";
import { tournamentService } from "../tournamentService";
import { Textarea } from "../../../components/ui/textarea";
import {
  Trophy,
  Clock,
  Globe,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Award,
  Twitter,
  ShieldCheck,
  Shuffle,
  Users,
} from "lucide-react";

interface CreateTournamentFormProps {
  onSuccess: (uniqueHash: string) => void;
}

export const CreateTournamentForm: FC<CreateTournamentFormProps> = ({
  onSuccess,
}) => {
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [socials, setSocials] = useState("");
  const [totalPlayers, setTotalPlayers] = useState("16");
  const [isBetting, setIsBetting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [gameMode, setGameMode] = useState("fast");
  const [maxRounds, setMaxRounds] = useState("5");
  const [randomStart, setRandomStart] = useState(true);
  const [moveTimeout, setMoveTimeout] = useState("30000");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const tournamentData: ICreateTournamentRequest = {
        walletAddress: publicKey.toString(),
        name,
        description,
        link,
        socals: socials,
        totalPlayers: parseInt(totalPlayers),
        isBet: isBetting,
        configuration: {
          mode: gameMode,
          max_rounds: parseInt(maxRounds),
          randomStart,
          moveTimeout: parseInt(moveTimeout),
          numberOfGames: 1,
        },
      };

      if (isBetting && paymentAmount) {
        tournamentData.paymentAmount = parseFloat(paymentAmount);
      }

      const response = await tournamentService.createTournament(tournamentData);

      if (response.status === "success" && response.insertHash) {
        setSuccessMessage(
          `Tournament created successfully! Share this code with players: ${response.insertHash}`
        );
        onSuccess(response.insertHash);
      } else {
        setError(response.msg || "Failed to create tournament");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative"
    >
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-800/10 rounded-full filter blur-3xl pointer-events-none"></div>

      <Card className="border-gray-800/70 backdrop-blur-md bg-black/40 shadow-xl max-w-3xl mx-auto relative overflow-hidden">
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-purple-500/5 to-transparent pointer-events-none"></div>

        <CardHeader className="border-b border-gray-800/50 bg-gradient-to-r from-black/60 to-gray-900/60 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="absolute right-6 top-6 w-12 h-12 text-amber-400 opacity-20"
          >
            <Trophy className="w-full h-full" />
          </motion.div>

          <CardTitle className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
              Create Tournament
            </span>
          </CardTitle>
          <CardDescription className="text-gray-400">
            Set up a chess tournament for players to join
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-200">
                  Basic Information
                </h3>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Tournament Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Summer Chess Championship"
                    required
                    className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="players"
                    className="text-gray-300 flex items-center gap-1.5"
                  >
                    <Users className="h-3.5 w-3.5 text-purple-400" />
                    Maximum Players
                  </Label>
                  <Input
                    id="players"
                    type="number"
                    min="2"
                    max="128"
                    value={totalPlayers}
                    onChange={(e) => setTotalPlayers(e.target.value)}
                    className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell players about your tournament..."
                  className="min-h-24 bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="link"
                    className="text-gray-300 flex items-center gap-1.5"
                  >
                    <Globe className="h-3.5 w-3.5 text-blue-400" />
                    Tournament Website (Optional)
                  </Label>
                  <Input
                    id="link"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://example.com"
                    className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="socials"
                    className="text-gray-300 flex items-center gap-1.5"
                  >
                    <Twitter className="h-3.5 w-3.5 text-blue-400" />
                    Social Media (Optional)
                  </Label>
                  <Input
                    id="socials"
                    value={socials}
                    onChange={(e) => setSocials(e.target.value)}
                    placeholder="https://twitter.com/yourtournament"
                    className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-5 pt-5 border-t border-gray-800/40"
            >
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-200">
                  Tournament Settings
                </h3>
              </div>

              <div className="space-y-3 bg-gray-900/20 p-4 rounded-lg border border-gray-800/60">
                <Label className="text-gray-300">Game Mode</Label>
                <RadioGroup
                  value={gameMode}
                  onValueChange={setGameMode}
                  className="flex flex-wrap gap-3 mt-2"
                >
                  <div className="flex items-center">
                    <div className="bg-black/40 border border-gray-800/80 hover:border-amber-500/40 rounded-full px-3 py-1.5 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="bullet"
                          id="bullet"
                          className="text-amber-500"
                        />
                        <Label
                          htmlFor="bullet"
                          className="cursor-pointer text-sm font-medium text-gray-300"
                        >
                          Bullet
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-black/40 border border-gray-800/80 hover:border-amber-500/40 rounded-full px-3 py-1.5 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="blitz"
                          id="blitz"
                          className="text-amber-500"
                        />
                        <Label
                          htmlFor="blitz"
                          className="cursor-pointer text-sm font-medium text-gray-300"
                        >
                          Blitz
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-black/40 border border-gray-800/80 hover:border-amber-500/40 rounded-full px-3 py-1.5 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="rapid"
                          id="rapid"
                          className="text-amber-500"
                        />
                        <Label
                          htmlFor="rapid"
                          className="cursor-pointer text-sm font-medium text-gray-300"
                        >
                          Rapid
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-black/40 border border-gray-800/80 hover:border-amber-500/40 rounded-full px-3 py-1.5 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="fast"
                          id="fast"
                          className="text-amber-500"
                        />
                        <Label
                          htmlFor="fast"
                          className="cursor-pointer text-sm font-medium text-gray-300"
                        >
                          Fast
                        </Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="bg-black/40 border border-gray-800/80 hover:border-amber-500/40 rounded-full px-3 py-1.5 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="classical"
                          id="classical"
                          className="text-amber-500"
                        />
                        <Label
                          htmlFor="classical"
                          className="cursor-pointer text-sm font-medium text-gray-300"
                        >
                          Classical
                        </Label>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="rounds"
                    className="text-gray-300 flex items-center gap-1.5"
                  >
                    <Award className="h-3.5 w-3.5 text-orange-400" />
                    Number of Rounds
                  </Label>
                  <Input
                    id="rounds"
                    type="number"
                    min="1"
                    max="20"
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(e.target.value)}
                    className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="moveTimeout"
                    className="text-gray-300 flex items-center gap-1.5"
                  >
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                    Move Timeout (ms)
                  </Label>
                  <Input
                    id="moveTimeout"
                    type="number"
                    min="5000"
                    step="1000"
                    value={moveTimeout}
                    onChange={(e) => setMoveTimeout(e.target.value)}
                    className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                  />
                  <p className="text-xs text-gray-500">
                    {parseInt(moveTimeout) / 1000} seconds per move
                  </p>
                </div>
              </div>

              <div className="bg-black/30 p-3 rounded-lg border border-gray-800/40 flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Shuffle className="h-5 w-5 text-purple-400" />
                </div>
                <div className="flex-grow flex items-center gap-3">
                  <Switch
                    id="randomStart"
                    checked={randomStart}
                    onCheckedChange={setRandomStart}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-600"
                  />
                  <Label
                    htmlFor="randomStart"
                    className="cursor-pointer text-gray-300"
                  >
                    Random starting positions
                  </Label>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-5 pt-5 border-t border-gray-800/40"
            >
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-200">
                  Betting Options
                </h3>
              </div>

              <div className="bg-black/30 p-3 rounded-lg border border-gray-800/40 flex items-center space-x-3">
                <div className="flex-grow flex items-center gap-3">
                  <Switch
                    id="betting"
                    checked={isBetting}
                    onCheckedChange={setIsBetting}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-600"
                  />
                  <Label
                    htmlFor="betting"
                    className="cursor-pointer text-gray-300"
                  >
                    Enable betting for this tournament
                  </Label>
                </div>
              </div>

              {isBetting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3 pl-6 border-l-2 border-amber-500/40 ml-3"
                >
                  <Label
                    htmlFor="paymentAmount"
                    className="text-amber-400 flex items-center gap-1.5"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Entry Fee (SOL)
                  </Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    required={isBetting}
                    className="bg-black/40 border-amber-500/30 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/50 text-amber-100"
                  />
                  <p className="text-xs text-amber-500/70">
                    Players will need to pay this amount to join the tournament
                  </p>
                </motion.div>
              )}
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 text-red-400 text-sm p-4 bg-red-950/20 rounded-lg border border-red-700/30"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 text-green-400 text-sm p-4 bg-green-950/20 rounded-lg border border-green-700/30"
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between border-t border-gray-800/50 bg-gradient-to-r from-black/60 to-gray-900/60 pt-6 pb-6">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="border-gray-700 bg-black/40 hover:bg-gray-900/60 hover:text-gray-100 transition-all duration-200 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !publicKey}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg shadow-amber-900/20 font-medium transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>Create Tournament</span>
                </div>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};
