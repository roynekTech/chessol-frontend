import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
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
import { useCreateTournament } from "../hooks/useTournamentHooks";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Globe, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Game mode type
type GameMode = "bullet" | "blitz" | "rapid" | "classical";

// Game mode options
const GAME_MODES = [
  { value: "bullet", label: "Bullet" },
  { value: "blitz", label: "Blitz" },
  { value: "rapid", label: "Rapid" },
  { value: "classical", label: "Classical" },
] as const;

export const CreateTournamentForm: FC = () => {
  const { publicKey } = useWallet();
  const { mutate: createTournament, isPending: isLoading } =
    useCreateTournament();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [gameMode, setGameMode] = useState<GameMode>("rapid");
  const [maxRounds, setMaxRounds] = useState(4);
  const [randomStart, setRandomStart] = useState(false);
  const [moveTimeout, setMoveTimeout] = useState(30000); // 30 seconds default
  const [numberOfGames, setNumberOfGames] = useState(1);
  const [isBet, setIsBet] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | undefined>();
  const [starterScore, setStarterScore] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!publicKey?.toBase58()) {
      setError("Please connect your wallet first");
      return;
    }

    if (!name.trim() || !description.trim()) {
      setError("Name and description are required");
      return;
    }

    if (isBet && !paymentAmount) {
      setError("Payment amount is required for betting tournaments");
      return;
    }

    const tournamentData: ICreateTournamentRequest = {
      name: name.trim(),
      description: description.trim(),
      walletAddress: publicKey.toBase58(),
      link: link.trim() || undefined,
      configuration: {
        mode: gameMode,
        max_rounds: maxRounds,
        randomStart,
        moveTimeout,
        numberOfGames,
        resignationTime: null,
        abortTimeout: null,
      },
      isBet,
      paymentAmount: isBet ? paymentAmount : undefined,
      starterScore,
    };

    createTournament(tournamentData, {
      onSuccess: (data) => {

        // Reset form
        setName("");
        setDescription("");
        setLink("");
        setGameMode("rapid");
        setMaxRounds(4);
        setRandomStart(false);
        setMoveTimeout(30000);
        setNumberOfGames(1);
        setIsBet(false);
        setPaymentAmount(undefined);
        setStarterScore(100);

        // navigate to the tournament page
        navigate(`/tournament/${data.insertHash}`);
      },
      onError: (err) => {
        setError(err.message);
      },
    });
  };

  return (
    <Card className="border-gray-800/70 backdrop-blur-md bg-gradient-to-b from-black/40 to-black/60 shadow-xl pt-0">
      <CardHeader className="border-b border-gray-800/50 bg-black/30 pt-8">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-700/30 to-black/30 flex items-center justify-center border border-amber-800/50">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
              Create Tournament
            </CardTitle>
            <CardDescription className="text-gray-400">
              Set up a new chess tournament with custom rules and settings
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300 pb-2">
                Tournament Name <span className="text-amber-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter tournament name"
                required
                className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-300 pb-2">
                Description <span className="text-amber-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your tournament"
                required
                className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="link" className="text-gray-300 pb-2">
                Tournament Link
              </Label>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-blue-400" />
                <Input
                  id="link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://..."
                  type="url"
                  className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Game Configuration */}
          <div className="space-y-4 bg-black/20 rounded-lg p-4 border border-gray-800/40">
            <h3 className="font-semibold text-amber-400 flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4" /> Game Settings
            </h3>

            <div>
              <Label className="text-gray-300">Game Mode</Label>
              <RadioGroup
                value={gameMode}
                onValueChange={(value: GameMode) => setGameMode(value)}
                className="flex flex-wrap gap-3 mt-2"
              >
                {GAME_MODES.map((mode) => (
                  <div key={mode.value} className="flex items-center">
                    <div className="bg-black/40 border border-gray-800/80 hover:border-amber-500/40 rounded-full px-3 py-1.5 transition-all duration-200">
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value={mode.value}
                          id={mode.value}
                          className="text-amber-500"
                        />
                        <Label
                          htmlFor={mode.value}
                          className="cursor-pointer text-sm font-medium text-gray-300"
                        >
                          {mode.label}
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxRounds" className="text-gray-300">
                  Maximum Rounds
                </Label>
                <Input
                  id="maxRounds"
                  type="number"
                  min={1}
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(Number(e.target.value))}
                  className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="numberOfGames" className="text-gray-300">
                  Games per Match
                </Label>
                <Input
                  id="numberOfGames"
                  type="number"
                  min={1}
                  value={numberOfGames}
                  onChange={(e) => setNumberOfGames(Number(e.target.value))}
                  className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="moveTimeout" className="text-gray-300">
                  Move Timeout (ms)
                </Label>
                <Input
                  id="moveTimeout"
                  type="number"
                  min={1000}
                  step={1000}
                  value={moveTimeout}
                  onChange={(e) => setMoveTimeout(Number(e.target.value))}
                  className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                />
                <span className="text-xs text-gray-500 mt-1 block">
                  {moveTimeout / 1000} seconds per move
                </span>
              </div>

              <div>
                <Label htmlFor="starterScore" className="text-gray-300">
                  Starting Score
                </Label>
                <Input
                  id="starterScore"
                  type="number"
                  value={starterScore}
                  onChange={(e) => setStarterScore(Number(e.target.value))}
                  className="bg-black/40 border-gray-800/80 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-gray-100"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 bg-black/30 p-3 rounded-lg border border-gray-800/40">
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
                Random Starting Positions
              </Label>
            </div>
          </div>

          {/* Betting Configuration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 bg-black/30 p-3 rounded-lg border border-gray-800/40">
              <Switch
                id="isBet"
                checked={isBet}
                onCheckedChange={setIsBet}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-purple-600"
              />
              <Label htmlFor="isBet" className="cursor-pointer text-gray-300">
                Enable Betting
              </Label>
            </div>

            {isBet && (
              <div className="pl-6 border-l-2 border-purple-500/40 ml-3">
                <Label
                  htmlFor="paymentAmount"
                  className="text-purple-400 flex items-center gap-1.5"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                  Entry Fee (SOL) <span className="text-purple-500">*</span>
                </Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  required
                  className="bg-black/40 border-purple-500/30 focus:border-purple-500/70 focus:ring-1 focus:ring-purple-500/50 text-purple-100"
                />
                <p className="text-xs text-purple-500/70 mt-1">
                  Players will need to pay this amount to join the tournament
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-gray-800/50 bg-black/30">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg shadow-amber-900/20 font-medium"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating Tournament...</span>
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
  );
};
