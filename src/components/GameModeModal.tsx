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
import { User, Bot, Swords, Zap, Clock } from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGetData } from "../utils/use-query-hooks";
import {
  OpponentTypeEnum,
  IWSCreatedMessage,
  IWSErrorMessage,
  LocalStorageRoomTypeEnum,
  WebSocketMessageTypeEnum,
  GameCategoryEnum,
  SideEnum,
} from "../utils/type";
import { toast } from "sonner";
import { useWebSocketContext } from "../context/useWebSocketContext";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { ESCROW_ADDRESS, PAGE_ROUTES } from "../utils/constants";
import { useChessGameStore } from "../stores/chessGameStore";
import { Color } from "chess.js";

interface GameModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameModeModal({ open, onOpenChange }: GameModeModalProps) {
  const navigate = useNavigate();
  const [gameCategory, setGameCategory] = useState<GameCategoryEnum>(
    GameCategoryEnum.Human
  );
  const [duration, setDuration] = useState<number>(300000); // default 5 min
  const [isBetting, setIsBetting] = useState<boolean>(false);
  const [playerAmount, setPlayerAmount] = useState<string>("");

  // Fetch SOL/USDT price
  const {
    data: solPriceData,
    isLoading: isSolPriceLoading,
    error: solPriceError,
  } = useGetData<{ price: number; source: string }>(
    "https://chesssol.com/api/chesssol/backend/solana-price",
    ["solanaPrice"],
    { refetchInterval: 30000 }
  );
  const [side, setSide] = useState<"w" | "b" | "random">("random"); // Allow "random" for side
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() || "";
  const [userClickedCreate, setUserClickedCreate] = useState<boolean>(false);
  const [gameCreated, setGameCreated] = useState<boolean>(false);
  const { sendMessage, lastMessage } = useWebSocketContext();
  const { connection } = useConnection();
  const { sendTransaction } = useWallet();

  const updateGameState = useChessGameStore((state) => state.updateGameState);
  const deleteGameState = useChessGameStore((state) => state.deleteGameState);

  const handleBetTransaction = async () => {
    if (!walletAddress || !publicKey) {
      toast.error("Please connect your wallet.");
      return;
    }
    if (
      !playerAmount ||
      isNaN(Number(playerAmount)) ||
      Number(playerAmount) <= 0
    ) {
      toast.error("Please enter a valid bet amount.");
      return;
    }
    try {
      const escrowPubkey = new PublicKey(ESCROW_ADDRESS);
      const lamports = Math.floor(Number(playerAmount) * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: escrowPubkey,
          lamports,
        })
      );
      // Prompt wallet to sign and send
      const signature = await sendTransaction(transaction, connection);
      // Optionally, wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
      return signature;
    } catch (err: unknown) {
      console.error("Error sending bet transaction:", err);

      let errorMsg =
        "An unexpected error occurred while sending your bet transaction.";
      let logs: string[] | undefined = undefined;

      // Check for Solana WalletSendTransactionError (or similar)
      if (
        err &&
        typeof err === "object" &&
        "getLogs" in err &&
        typeof err.getLogs === "function"
      ) {
        logs = await err.getLogs();
      }

      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "string") {
        errorMsg = err;
      }

      // Friendly, actionable error message for the user
      let userMessage = "Transaction failed. ";
      if (
        errorMsg.includes("Simulation failed") ||
        errorMsg.includes("debit an account")
      ) {
        userMessage +=
          "Please ensure your wallet has enough SOL to cover the bet and transaction fees. " +
          "If the problem persists, try reconnecting your wallet or refreshing the page.";
      } else {
        userMessage += errorMsg;
      }

      // Show toast to user
      toast.error(userMessage);

      // Log full error and logs for developer debugging
      console.error(
        "Error sending bet transaction:",
        err,
        logs ? `\nSolana logs:\n${logs.join("\n")}` : ""
      );
    }
  };

  const handleStartGame = (autoProceed = false) => {
    // Validation: Check if wallet is connected
    if (!walletAddress) {
      toast.error("Please connect your wallet to create game.");
      return;
    }

    setUserClickedCreate(true);

    (async () => {
      let txHash = "";
      if (isBetting && playerAmount && !autoProceed) {
        txHash = (await handleBetTransaction()) || "";
        console.log("txHash", txHash);
        if (!txHash) {
          setUserClickedCreate(false);
          return;
        }
      }

      console.log("start game txHash", txHash);

      // Prepare and send message to WebSocket server
      const message = {
        type: WebSocketMessageTypeEnum.Create,
        walletAddress,
        side: side === "random" ? (Math.random() < 0.5 ? "w" : "b") : side,
        duration,
        isBetting,
        transactionId: txHash,
        playerAmount: Number(playerAmount || 0),
        cat: gameCategory, // Use the selected gameCategory
      };
      console.log("Sending Create Game message:", message);
      sendMessage(JSON.stringify(message));
      setGameCreated(false);
    })();
  };

  // listen to ws
  useEffect(() => {
    if (!lastMessage?.data) {
      return;
    }

    try {
      const messageData = JSON.parse(lastMessage.data);

      if (
        messageData.type === WebSocketMessageTypeEnum.Created ||
        messageData.type === WebSocketMessageTypeEnum.Joined
      ) {
        const createdMessage = messageData as IWSCreatedMessage;

        // Validate color assignment
        if (side !== SideEnum.Random && createdMessage.color !== side) {
          console.error("Server assigned different color than requested:", {
            requested: side,
            assigned: createdMessage.color,
          });
          toast.error("Error: Unexpected color assignment from server");
          setUserClickedCreate(false);
          return;
        }

        // delete game state before setting new game state
        deleteGameState();

        // Determine opponent type for the store based on the game category used for creation
        const storeOpponentType =
          gameCategory === GameCategoryEnum.AI
            ? OpponentTypeEnum.Computer
            : OpponentTypeEnum.Human;

        updateGameState({
          roomType: LocalStorageRoomTypeEnum.PLAYER,
          opponentType: storeOpponentType,
          cat: gameCategory, // Store the category used to create the game
          gameId: createdMessage.gameId,
          fen: createdMessage.fen,
          isBetting: createdMessage.isBetting,
          playerColor: createdMessage.color as Color,
          isJoined: true,
          duration: createdMessage?.duration || duration,
          playerWalletAddress: walletAddress,
        });

        setGameCreated(true);
        setUserClickedCreate(false);

        // Navigate based on game category
        if (gameCategory === GameCategoryEnum.AI) {
          navigate(PAGE_ROUTES.GamePlay);
        } else {
          navigate(PAGE_ROUTES.Lobby);
        }
        onOpenChange(false);
      } else if (messageData.type === WebSocketMessageTypeEnum.Error) {
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
      }, 3 * 60 * 1000); // 3 minutes
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [userClickedCreate, gameCreated]);

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
                defaultValue={gameCategory}
                onValueChange={(value: GameCategoryEnum) => {
                  setGameCategory(value);
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value={GameCategoryEnum.Human}
                    id="human-vs-human"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="human-vs-human"
                    className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-900/30 to-purple-700/10 flex items-center justify-center mb-3 [&:has([data-state=checked])]:from-purple-600/40">
                      <User className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="text-sm font-medium text-center">
                      Human vs Human
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value={GameCategoryEnum.Pair}
                    id="pair-link"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="pair-link"
                    className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-900/30 to-green-700/10 flex items-center justify-center mb-3 [&:has([data-state=checked])]:from-green-600/40">
                      <Swords className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="text-sm font-medium text-center">
                      Play with random opponent
                    </div>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value={GameCategoryEnum.AI}
                    id="play-vs-ai"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="play-vs-ai"
                    className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-900/30 to-blue-700/10 flex items-center justify-center mb-3 [&:has([data-state=checked])]:from-blue-600/40">
                      <Bot className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-sm font-medium text-center">
                      Play vs AI
                    </div>
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
                {[60000, 180000, 300000, 600000, 900000].map((ms) => {
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
                  className="grid grid-cols-3 gap-4"
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
                        <span className="text-black text-2xl font-bold">♔</span>
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
                        <span className="text-white text-2xl font-bold">♚</span>
                      </div>
                      <div className="text-sm font-medium">Black</div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="random"
                      id="side-random"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="side-random"
                      className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer h-full"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600/90 to-gray-800/90 flex items-center justify-center mb-2 border border-gray-500 ring-1 ring-gray-400/50 peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:ring-amber-400/60">
                        <Zap className="h-5 w-5 text-gray-300" />
                      </div>
                      <div className="text-sm font-medium">Random</div>
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
                    className="space-y-4 overflow-hidden mt-4"
                  >
                    <div>
                      <Label
                        htmlFor="bet-amount"
                        className="mb-3 font-medium text-gray-300 flex items-center"
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
                        className="mt-2 bg-black/40 border-gray-700 text-white focus:border-amber-500 focus:ring-amber-500 rounded-md"
                        required={isBetting}
                      />
                      {/* USDT Equivalent Display */}
                      <div
                        className="mt-2 flex items-center space-x-2"
                        aria-live="polite"
                      >
                        {isSolPriceLoading ? (
                          <span className="animate-pulse text-gray-400 text-sm">
                            Fetching price...
                          </span>
                        ) : solPriceError ? (
                          <span className="text-red-500 text-sm">
                            Unable to fetch price
                          </span>
                        ) : (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black/90 shadow-lg rounded-lg px-3 py-1 text-sm font-semibold glassmorphism">
                            ${" "}
                            {playerAmount &&
                            !isNaN(Number(playerAmount)) &&
                            solPriceData?.price
                              ? (
                                  parseFloat(playerAmount) * solPriceData.price
                                ).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "—"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* <div>
                        <p className="text-sm text-white mb-2 bg-gray-500 rounded-md p-2">
                          Note: You can click on "Start Game" and pay if you
                          don't want to manually send the transaction.
                        </p>
                        <Label
                          htmlFor="tx-hash"
                          className="text-sm text-gray-400"
                        >
                          Payment Hash
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
                      </div> */}
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="pt-4"
            >
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-4 sm:py-6 text-lg rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-amber-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                onClick={() => handleStartGame()}
                disabled={(isBetting && !playerAmount) || userClickedCreate}
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
