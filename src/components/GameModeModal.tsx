import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, Bot, Swords, Trophy, Zap, Crown, Clock } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  IGameDetailsLocalStorage,
  IWSCreatedMessage,
  IWSErrorMessage,
  LocalStorageKeysEnum,
  WebSocketMessageTypeEnum,
} from "../utils/type";
import { localStorageHelper } from "../utils/localStorageHelper";
import { toast } from "sonner";
import { useWebSocketContext } from "../context/useWebSocketContext";

interface GameModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameModeModal({ open, onOpenChange }: GameModeModalProps) {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<"human" | "computer">("human");
  const [computerColor, setComputerColor] = useState<"w" | "b">("b");
  const [difficulty, setDifficulty] = useState<number>(10);
  const [duration, setDuration] = useState<number>(300000); // default 5 min
  const [isBetting, setIsBetting] = useState<boolean>(false);
  const [playerAmount, setPlayerAmount] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [side, setSide] = useState<"w" | "b">("w");
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() || "";

  const [userClickedCreate, setUserClickedCreate] = useState<boolean>(false);
  const [gameCreated, setGameCreated] = useState<boolean>(false);

  const { sendMessage, lastMessage } = useWebSocketContext();

  const handleStartGame = () => {
    if (gameMode === "computer") {
      // Navigate directly for computer game
      const playerPlaysAs = computerColor === "w" ? "b" : "w"; // Determine human player color
      const computerParams = new URLSearchParams({
        difficulty: String(difficulty),
        computerColor: computerColor,
        playerColor: playerPlaysAs, // Optional: Pass what color human plays
        duration: String(duration), // Add duration parameter
      });
      console.log(
        `Starting computer game with params: ${computerParams.toString()}`
      );
      navigate(`/game-play/computer?${computerParams.toString()}`);
      onOpenChange(false); // Close modal after navigating
    } else {
      // Validation: if betting, require amount and txHash
      if (isBetting && (!playerAmount || !transactionId)) {
        toast.error("Please enter betting amount and transaction hash.");
        return;
      }

      // Validation: Check if wallet is connected
      if (!walletAddress) {
        toast.error("Please connect your wallet to create a human game.");
        // Consider prompting wallet connection here if using a wallet adapter modal
        return;
      }

      // Prepare and send message to WebSocket server
      const message = {
        type: WebSocketMessageTypeEnum.Create,
        walletAddress,
        side, // User's chosen side
        duration,
        isBetting,
        transactionId: isBetting ? transactionId : null, // Send null if not betting
        playerAmount: isBetting ? Number(playerAmount) : null,
      };

      console.log("Sending Create Game (Human) message:", message);
      sendMessage(JSON.stringify(message));

      setUserClickedCreate(true);
      setGameCreated(false);
    }
  };

  // listen to ws
  useEffect(() => {
    if (!lastMessage?.data) {
      return;
    }

    try {
      const messageData = JSON.parse(lastMessage.data);

      if (
        messageData.type === WebSocketMessageTypeEnum.Created &&
        userClickedCreate
      ) {
        const createdMessage = messageData as IWSCreatedMessage;
        console.log("Received game creation response:", {
          requestedColor: side,
          assignedColor: createdMessage.color,
          fullMessage: createdMessage,
        });

        // Validate color assignment
        if (createdMessage.color !== side) {
          console.error("Server assigned different color than requested:", {
            requested: side,
            assigned: createdMessage.color,
          });
          toast.error("Error: Unexpected color assignment from server");
          setUserClickedCreate(false);
          return;
        }

        const data: IGameDetailsLocalStorage = {
          gameId: createdMessage.gameId,
          fen: createdMessage.fen,
          isBetting: createdMessage.isBetting,
          playerColor: createdMessage.color,
          isJoined: true,
          duration: createdMessage?.duration || duration,
        };
        localStorageHelper.setItem(LocalStorageKeysEnum.GameDetails, data);

        setGameCreated(true);
        setUserClickedCreate(false);

        // Navigate to lobby and wait for opponent to join
        navigate("/lobby");
        onOpenChange(false);
      } else if (
        messageData.type === WebSocketMessageTypeEnum.Error &&
        userClickedCreate
      ) {
        const errorMessage = messageData as IWSErrorMessage;
        console.error("Received Error message:", errorMessage);
        toast.error(
          `Game creation failed: ${errorMessage.message || "Unknown error"}`
        );
        setUserClickedCreate(false); // Reset click tracker on error
      }
    } catch (error) {
      console.error(
        "Error parsing WebSocket message or unexpected data:",
        error,
        lastMessage.data
      );
      toast.error(
        "An error occurred while processing the game creation. Please try again."
      );
      setUserClickedCreate(false); // Reset click tracker on error
    }
  }, [lastMessage, userClickedCreate, navigate, onOpenChange]);

  // show error after 10 seconds if game is not created
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (userClickedCreate && !gameCreated) {
      // Set a timeout only if the user clicked create and the game hasn't been confirmed yet
      timeoutId = setTimeout(() => {
        // Check again inside the timeout to ensure game wasn't created in the meantime
        if (userClickedCreate && !gameCreated) {
          toast.error(
            "Game creation timed out. Please check your connection and try again."
          );
          setUserClickedCreate(false);
        }
      }, 15000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [userClickedCreate, gameCreated]);

  // Define difficulty info
  const difficultyInfo = {
    7: {
      name: "Beginner",
      elo: "~1600",
      icon: <User className="h-5 w-5 text-green-400" />,
    },
    10: {
      name: "Intermediate",
      elo: "~2050",
      icon: <Swords className="h-5 w-5 text-blue-400" />,
    },
    13: {
      name: "Advanced",
      elo: "~2500",
      icon: <Trophy className="h-5 w-5 text-purple-400" />,
    },
    16: {
      name: "Master",
      elo: "~3000",
      icon: <Crown className="h-5 w-5 text-amber-400" />,
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-black text-white border border-amber-900/20 max-w-md w-full rounded-xl p-0 shadow-xl shadow-amber-900/10 overflow-hidden max-h-[90vh] overflow-y-auto sm:max-h-[80vh] sm:p-0"
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="relative p-4 sm:p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-bold text-center">
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
                Choose Game Mode
              </span>
              <motion.div
                className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-600 rounded-full mx-auto mt-2"
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            {/* Game Mode Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="mb-3 font-medium text-gray-300 flex items-center">
                <Zap className="mr-2 h-4 w-4 text-amber-400" />
                Select Mode
              </h3>
              <RadioGroup
                defaultValue={gameMode}
                onValueChange={(value) =>
                  setGameMode(value as "human" | "computer")
                }
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="human"
                    id="human"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="human"
                    className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-900/30 to-purple-700/10 flex items-center justify-center mb-3 [&:has([data-state=checked])]:from-purple-600/40">
                      <User className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="text-sm font-medium">Human vs Human</div>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem
                    value="computer"
                    id="computer"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="computer"
                    className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-900/30 to-blue-700/10 flex items-center justify-center mb-3 [&:has([data-state=checked])]:from-blue-600/40">
                      <Bot className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-sm font-medium">Play vs Computer</div>
                  </Label>
                </div>
              </RadioGroup>
            </motion.div>

            {/* Duration Selection */}
            <motion.div
              key="duration-section"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <h3 className="mb-3 font-medium text-gray-300 flex items-center">
                <Clock className="mr-2 h-4 w-4 text-amber-400" />
                Duration
              </h3>
              <RadioGroup
                defaultValue={String(duration)}
                onValueChange={(value) => setDuration(Number(value))}
                className="grid grid-cols-4 gap-3"
              >
                {[180000, 300000, 600000, 900000].map((ms) => {
                  const minutes = ms / 60000;
                  return (
                    <div key={ms}>
                      <RadioGroupItem
                        value={String(ms)}
                        id={`duration-${ms}`}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={`duration-${ms}`}
                        className="flex flex-col items-center justify-center rounded-lg border border-gray-700 bg-black/40 backdrop-blur-sm p-3 hover:bg-gray-800/40 hover:border-amber-700/50 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer text-center h-full"
                      >
                        <span className="text-lg font-semibold">{minutes}</span>
                        <span className="text-xs text-gray-400">min</span>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </motion.div>

            {/* Human vs Human Specific Settings */}
            {gameMode === "human" && (
              <motion.div
                key="human-settings"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="space-y-8 overflow-hidden"
              >
                <div>
                  <h3 className="mb-3 font-medium text-gray-300 flex items-center">
                    <Zap className="mr-2 h-4 w-4 text-amber-400" />
                    Choose Your Side
                  </h3>
                  <RadioGroup
                    defaultValue={side}
                    onValueChange={(value) => setSide(value as "w" | "b")}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="w"
                        id="side-white"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="side-white"
                        className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/90 to-gray-200/70 flex items-center justify-center mb-2 border border-gray-400 ring-1 ring-gray-300/50 peer-data-[state=checked]:border-amber-300 peer-data-[state=checked]:ring-amber-400/60">
                          <span className="text-black text-2xl font-bold">
                            ♔
                          </span>
                        </div>
                        <div className="text-sm font-medium">White</div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="b"
                        id="side-black"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="side-black"
                        className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-900/90 to-black/90 flex items-center justify-center mb-2 border border-gray-700 ring-1 ring-gray-600/50 peer-data-[state=checked]:border-amber-600 peer-data-[state=checked]:ring-amber-500/60">
                          <span className="text-white text-2xl font-bold">
                            ♚
                          </span>
                        </div>
                        <div className="text-sm font-medium">Black</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-300 flex items-center">
                      <Zap className="mr-2 h-4 w-4 text-amber-400" />
                      Wager SOL (Optional)
                    </h3>
                    <Switch
                      checked={isBetting}
                      onCheckedChange={setIsBetting}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                  {isBetting && (
                    <motion.div
                      key="betting-inputs"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div>
                        <Label
                          htmlFor="bet-amount"
                          className="text-sm text-gray-400"
                        >
                          Bet Amount (SOL)
                        </Label>
                        <Input
                          id="bet-amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="e.g., 0.1"
                          value={playerAmount}
                          onChange={(e) => setPlayerAmount(e.target.value)}
                          className="mt-1 bg-black/40 border-gray-700 text-white focus:border-amber-500 focus:ring-amber-500 rounded-md"
                          required={isBetting}
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="tx-hash"
                          className="text-sm text-gray-400"
                        >
                          Escrow Transaction Hash
                        </Label>
                        <Input
                          id="tx-hash"
                          type="text"
                          placeholder="Paste Solana transaction signature"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="mt-1 bg-black/40 border-gray-700 text-white focus:border-amber-500 focus:ring-amber-500 rounded-md"
                          required={isBetting}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Computer vs Player Specific Settings */}
            {gameMode === "computer" && (
              <motion.div
                key="computer-settings"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="space-y-8 overflow-hidden"
              >
                <div>
                  <h3 className="mb-3 font-medium text-gray-300 flex items-center">
                    <Zap className="mr-2 h-4 w-4 text-amber-400" />
                    Choose Your Color
                  </h3>
                  <RadioGroup
                    value={computerColor === "w" ? "b" : "w"}
                    onValueChange={(playerChoice) =>
                      setComputerColor(playerChoice === "w" ? "b" : "w")
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="w"
                        id="play-white"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="play-white"
                        className="flex items-center justify-center rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                      >
                        <div className="flex items-center justify-center bg-gradient-to-br from-white/90 to-gray-200/70 text-black rounded-full w-8 h-8 mr-3 ring-1 ring-gray-300/50 border border-gray-400 peer-data-[state=checked]:border-amber-300 peer-data-[state=checked]:ring-amber-400/60">
                          ♟
                        </div>
                        <div className="text-sm font-medium">White</div>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem
                        value="b"
                        id="play-black"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="play-black"
                        className="flex items-center justify-center rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                      >
                        <div className="flex items-center justify-center bg-gradient-to-br from-gray-900/90 to-black/90 text-white rounded-full w-8 h-8 mr-3 ring-1 ring-gray-600/50 border border-gray-700 peer-data-[state=checked]:border-amber-600 peer-data-[state=checked]:ring-amber-500/60">
                          ♟
                        </div>
                        <div className="text-sm font-medium">Black</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <h3 className="mb-3 font-medium text-gray-300 flex items-center">
                    <Zap className="mr-2 h-4 w-4 text-amber-400" />
                    Select Difficulty
                  </h3>
                  <RadioGroup
                    defaultValue={String(difficulty)}
                    onValueChange={(value) => setDifficulty(Number(value))}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    {Object.entries(difficultyInfo).map(([level, info]) => (
                      <div key={level}>
                        <RadioGroupItem
                          value={level}
                          id={info.name.toLowerCase()}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={info.name.toLowerCase()}
                          className="flex flex-col items-center justify-between rounded-lg border border-gray-700 bg-black/40 backdrop-blur-sm p-3 hover:bg-gray-800/40 hover:border-amber-700/50 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer text-center h-full"
                        >
                          <div className="mb-1">{info.icon}</div>
                          <div className="text-sm font-medium">{info.name}</div>
                          <div className="text-xs text-amber-500/80 font-medium">
                            {info.elo}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="pt-4"
            >
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-4 sm:py-6 text-lg rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-amber-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                onClick={handleStartGame}
                disabled={
                  (gameMode === "human" &&
                    isBetting &&
                    (!playerAmount || !transactionId)) ||
                  userClickedCreate
                }
              >
                {userClickedCreate ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{ display: "inline-block", marginRight: "8px" }}
                    >
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </motion.div>
                    Creating Game...
                  </>
                ) : (
                  <>
                    <Swords className="mr-2 h-5 w-5" />
                    Start Game
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
