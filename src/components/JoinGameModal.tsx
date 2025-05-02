import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Info, DollarSign, Hash } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  IGameDetailsLocalStorage,
  LocalStorageKeysEnum,
  WebSocketMessageTypeEnum,
  IWSJoinedMessage,
  IWSErrorMessage,
  IWSJoinMessage,
} from "../utils/type";
import { localStorageHelper } from "../utils/localStorageHelper";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useWebSocketContext } from "../context/useWebSocketContext";
import { useGetData } from "../utils/use-query-hooks";

interface IJoinGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinGameModal({ open, onOpenChange }: IJoinGameModalProps) {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState<string>("");
  const [isBettingGame, setIsBettingGame] = useState<boolean>(false);
  const [requiredAmount, setRequiredAmount] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() || "";
  const { sendMessage, lastMessage } = useWebSocketContext();
  const [retrievedGameDetails, setRetrievedGameDetails] = useState({});

  // fetch game details
  const { data: gameDetails, isLoading: isLoadingGameDetails } = useGetData(
    `gameData/${gameId}`,
    ["gameDetails", gameId],
    {
      enabled: !!gameId,
    }
  );

  useEffect(() => {
    if (gameDetails) {
      setRetrievedGameDetails(gameDetails);
    }
  }, [gameDetails]);

  console.log("gameDetails", gameDetails);

  useEffect(() => {
    if (!open) {
      setGameId("");
      setIsBettingGame(false);
      setRequiredAmount("");
      setTransactionId("");
      setIsJoining(false);
    }
  }, [open]);

  // function to handle join game
  const handleJoinGame = () => {
    if (!gameId || !walletAddress) {
      toast.error("Game ID and wallet are required.");
      return;
    }
    if (isBettingGame && (!requiredAmount || !transactionId)) {
      toast.error(
        "Amount and transaction hash are required for betting games."
      );
      return;
    }
    setIsJoining(true);
    setTimeout(() => {
      if (isJoining) {
        setIsJoining(false);
        toast.error("Join request timed out. Please try again.");
      }
    }, 10000); // 10 seconds timeout

    const message: IWSJoinMessage = {
      type: WebSocketMessageTypeEnum.Join,
      gameId: gameId,
      walletAddress: walletAddress,
    };
    if (isBettingGame) {
      message.transactionId = transactionId;
      message.playerAmount = Number(requiredAmount);
    }
    sendMessage(JSON.stringify(message));
    toast.info("Attempting to join game...");
  };

  // listen to websocket and handle join event
  useEffect(() => {
    if (!lastMessage?.data || !lastMessage?.event || !gameId) {
      return;
    }

    let messageData: IWSJoinedMessage | IWSErrorMessage;
    try {
      messageData = JSON.parse(lastMessage.data) as
        | IWSJoinedMessage
        | IWSErrorMessage;
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
      setIsJoining(false);
      return;
    }

    if (
      messageData.type !== WebSocketMessageTypeEnum.Error &&
      messageData.gameId !== gameId
    ) {
      return;
    }

    if (messageData.type === WebSocketMessageTypeEnum.Joined) {
      const joinedMessage = messageData;
      const data: IGameDetailsLocalStorage = {
        gameId: joinedMessage.gameId,
        fen: joinedMessage.fen,
        isBetting: joinedMessage.isBetting,
        playerColor: joinedMessage.color,
        isJoined: true,
        duration: joinedMessage.duration,
        playerWalletAddress: walletAddress,
      };
      localStorageHelper.setItem(LocalStorageKeysEnum.GameDetails, data);
      toast.success(`Successfully joined game ${joinedMessage.gameId}`);
      setIsJoining(false);
      onOpenChange(false);
      navigate(`/game-play/human`);
    } else if (messageData.type === WebSocketMessageTypeEnum.Error) {
      if (isJoining) {
        toast.error(
          `Failed to join game: ${messageData.message || "Unknown error"}`
        );
        setIsJoining(false);
      }
    }
  }, [lastMessage]);

  const canJoin = isBettingGame
    ? !!transactionId && !!requiredAmount && !isNaN(Number(requiredAmount))
    : !!gameId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-black text-white border border-amber-900/20 max-w-md w-full rounded-xl p-0 shadow-xl shadow-amber-900/10 overflow-hidden max-h-[90vh] overflow-y-auto sm:max-h-[80vh] sm:p-0"
        style={{ overscrollBehavior: "contain" }}
        onInteractOutside={(e) => {
          if (isJoining) {
            e.preventDefault();
          }
        }}
      >
        <div className="relative p-4 sm:p-6">
          <DialogHeader className="mb-6 text-center">
            <DialogTitle className="text-3xl font-bold text-center">
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
                Join Game
              </span>
              <motion.div
                className="h-1 w-16 bg-gradient-to-r from-amber-400 to-orange-600 rounded-full mx-auto mt-2"
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </DialogTitle>
            <DialogDescription className="text-gray-400 pt-2">
              Enter the details to join an existing game.
            </DialogDescription>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Game ID Input */}
            <div>
              <Label
                htmlFor="game-id"
                className="text-gray-300 flex items-center mb-1"
              >
                <Info className="mr-2 h-4 w-4 text-blue-400" /> Game ID
              </Label>
              <Input
                id="game-id"
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="Enter Game ID to join"
                className="mt-1 bg-gray-900/50 border-gray-700 text-gray-300"
                autoFocus
              />
            </div>

            {/* Betting Toggle */}
            <div className="flex items-center gap-3 mt-2">
              <Switch
                checked={isBettingGame}
                onCheckedChange={setIsBettingGame}
                id="betting-switch"
              />
              <Label
                htmlFor="betting-switch"
                className="text-amber-400 font-medium"
              >
                Betting Game?
              </Label>
            </div>

            {/* Betting Fields */}
            {isBettingGame && (
              <div className="space-y-4 p-4 border border-amber-800/30 rounded-lg bg-gradient-to-b from-amber-950/10 to-black/20 mt-2">
                <h3 className="font-medium text-amber-400 flex items-center text-lg">
                  <DollarSign className="mr-2 h-5 w-5" /> Betting Required
                </h3>
                <div>
                  <Label htmlFor="required-amount" className="text-gray-300">
                    Required Amount (SOL)
                  </Label>
                  <Input
                    id="required-amount"
                    type="number"
                    min={0}
                    value={requiredAmount}
                    onChange={(e) => setRequiredAmount(e.target.value)}
                    placeholder="e.g. 0.5"
                    className="mt-1 bg-black/40 border-gray-700 text-white focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="tx-hash-join"
                    className="text-gray-300 flex items-center mb-1"
                  >
                    <Hash className="mr-2 h-4 w-4 text-purple-400" />{" "}
                    Transaction Hash
                  </Label>
                  <Input
                    id="tx-hash-join"
                    type="text"
                    placeholder="Paste your deposit transaction hash"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="mt-1 bg-black/40 border-gray-700 text-white focus:border-amber-500 focus:ring-amber-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the hash of the transaction where you sent the
                    required amount.
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 font-semibold py-6 rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-300 transform hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleJoinGame}
              disabled={isJoining || !canJoin || !walletAddress}
            >
              {isJoining ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-t-transparent border-white rounded-full mr-2"
                />
              ) : (
                <LogIn className="mr-2 h-5 w-5" />
              )}
              {isJoining ? "Joining Game..." : "Join Game"}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
