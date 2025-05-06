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
import { LogIn, Info, DollarSign } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  WebSocketMessageTypeEnum,
  IWSJoinedMessage,
  IWSErrorMessage,
  IWSJoinMessage,
  IGetGameDataMemResponse,
  LocalStorageRoomTypeEnum,
  OpponentTypeEnum,
} from "../utils/type";
import { toast } from "sonner";
import { useWebSocketContext } from "../context/useWebSocketContext";
import { useGetData } from "../utils/use-query-hooks";
import { API_PATHS, ESCROW_ADDRESS, PAGE_ROUTES } from "../utils/constants";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useChessGameStore } from "../stores/chessGameStore";
import { Color } from "chess.js";

interface IJoinGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinGameModal({ open, onOpenChange }: IJoinGameModalProps) {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState<string>("");
  const [debouncedGameId, setDebouncedGameId] = useState<string>("");
  const [isBettingGame, setIsBettingGame] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const { publicKey } = useWallet();
  const { sendTransaction } = useWallet();
  const { connection } = useConnection();
  const walletAddress = publicKey?.toBase58() || "";
  const { sendMessage, lastMessage } = useWebSocketContext();
  const [fetchGameErrorMsg, setFetchGameErrorMsg] = useState<string>("");
  const [retrievedGameDetails, setRetrievedGameDetails] =
    useState<IGetGameDataMemResponse | null>(null);

  const updateGameState = useChessGameStore((state) => state.updateGameState);
  const deleteGameState = useChessGameStore((state) => state.deleteGameState);

  // fetch game details
  const {
    data: gameDetails,
    isLoading: isLoadingGameDetails,
    isFetched,
  } = useGetData<IGetGameDataMemResponse>(
    API_PATHS.getInMemGameDetails(debouncedGameId),
    ["gameDetails", debouncedGameId],
    {
      enabled: !!debouncedGameId,
    }
  );

  const handleBetTransaction = async () => {
    if (!walletAddress || !publicKey) {
      toast.error("Please connect your wallet.");
      return;
    }
    try {
      const escrowPubkey = new PublicKey(ESCROW_ADDRESS);
      const lamports = Math.floor(Number(0.5) * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: escrowPubkey,
          lamports,
        })
      );

      // Prompt wallet to sign and send
      const signature = await sendTransaction(transaction, connection);
      // wait for confirmation of transaction
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

  // handle fetch game details
  useEffect(() => {
    console.log("fetching game details");
    if (gameDetails) {
      setFetchGameErrorMsg("");
      if (
        [
          "checkmate",
          "aborted",
          "abandoned",
          "draw",
          "stalemate",
          "resign",
          "ended",
        ].includes(gameDetails?.game_state)
      ) {
        toast.error("Game is already ended, please provide another game ID.");
        setTimeout(() => {
          navigate(PAGE_ROUTES.OngoingGames);
        }, 2000);
        return;
      }

      setIsBettingGame(gameDetails.bet_status);
      setRetrievedGameDetails(gameDetails);
    }

    if (!gameDetails && gameId && isFetched && !isLoadingGameDetails) {
      setFetchGameErrorMsg("Please provide a valid game ID.");
    }
  }, [gameDetails, isLoadingGameDetails, isFetched]);

  useEffect(() => {
    if (!open) {
      setGameId("");
      setIsBettingGame(false);
      setIsJoining(false);
    }
  }, [open]);

  // handle debounce game id
  useEffect(() => {
    setFetchGameErrorMsg("");
    const handler = setTimeout(() => {
      setDebouncedGameId(gameId);
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [gameId]);

  // function to handle join game
  const handleJoinGame = () => {
    if (!gameId || !walletAddress) {
      toast.error("Please provide a valid game ID and connect your wallet.");
      return;
    }

    setIsJoining(true);

    (async () => {
      const signature = gameDetails?.bet_status
        ? await handleBetTransaction()
        : "";
      console.log("signature", signature);

      const message: IWSJoinMessage = {
        type: WebSocketMessageTypeEnum.Join,
        gameId: gameId,
        walletAddress: walletAddress,
        transactionId: signature,
        playerAmount: retrievedGameDetails?.amount,
      };

      sendMessage(JSON.stringify(message));
    })();
  };

  // check for joining timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isJoining) {
        setIsJoining(false);
        toast.error("There was an error joining the game. Please try again.");
      }
    }, 2 * 60 * 1000); // 2 minutes timeout

    return () => clearTimeout(timeout);
  }, [isJoining]);

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

      // delete game state before setting new game state
      deleteGameState();

      updateGameState({
        roomType: LocalStorageRoomTypeEnum.PLAYER,
        opponentType: OpponentTypeEnum.Human,
        gameId: joinedMessage.gameId,
        fen: joinedMessage.fen,
        isBetting: joinedMessage.isBetting,
        playerColor: joinedMessage.color as Color,
        isJoined: true,
        duration: joinedMessage.duration,
        playerWalletAddress: walletAddress,
      });

      setIsJoining(false);
      onOpenChange(false);
      navigate(PAGE_ROUTES.GamePlay);
    } else if (messageData.type === WebSocketMessageTypeEnum.Error) {
      if (isJoining) {
        toast.error(
          `Failed to join game: ${messageData.message || "Unknown error"}`
        );
        setIsJoining(false);
      }
    }
  }, [lastMessage]);

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
                className="text-gray-300 flex items-center mb-3"
              >
                <Info className="mr-2 h-4 w-4 text-blue-400" /> Game ID
              </Label>
              {fetchGameErrorMsg && gameId && (
                <p className="text-red-500 text-sm mb-2">{fetchGameErrorMsg}</p>
              )}
              <Input
                id="game-id"
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="Enter Game ID to join"
                className="mt-1 bg-gray-900/50 border-gray-700 text-gray-300"
                autoFocus
              />
              {isLoadingGameDetails && !isFetched && (
                <p className="text-gray-500 text-sm mt-2">
                  Loading game details...
                </p>
              )}
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
                    value={retrievedGameDetails?.amount}
                    placeholder="e.g. 0.5"
                    className="mt-1 bg-black/40 border-gray-700 text-white focus:border-amber-500 focus:ring-amber-500"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You will be prompted to approve the transaction automatically
                  when joining a betting game.
                </p>
              </div>
            )}

            {/* Action Button */}
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 font-semibold py-6 rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-300 transform hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              onClick={handleJoinGame}
              disabled={isJoining || !walletAddress || !gameDetails}
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
