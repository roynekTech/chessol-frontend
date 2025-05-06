import { useCallback, useEffect, useState, useRef } from "react";
import { Chess, Square, Color } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWebSocketContext } from "../../context/useWebSocketContext";
import {
  WebSocketMessageTypeEnum,
  IWSErrorMessage,
  IWSGameEndedMessage,
  IWSMoveBroadcast,
  IWSMoveMessage,
  IWSJoinedMessage,
  IWSReconnectMessage,
  IWSReconnectedMessage,
  IGetGameDataMemResponse,
  LocalStorageRoomTypeEnum,
  IWSViewingGameMessage,
} from "../../utils/type";
import { calculateCapturedPieces } from "../../utils/chessUtils";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import ChatDropdown from "../../components/game/ChatDropdown";
import { helperUtil } from "../../utils/helper";
import { API_PATHS, PAGE_ROUTES } from "../../utils/constants";
import { useGetData } from "../../utils/use-query-hooks";
import { LoaderWithInnerLoader } from "../../components/Loader";
import { PlayerPanel } from "../../components/game/PlayerPanel";
import { useChessGameStore } from "../../stores/chessGameStore";

// Sound files
const MOVE_SOUND_SRC = "/move-sound.wav";
const CAPTURE_SOUND_SRC = "/capture-sound.wav";

export function HumanVsHumanV2() {
  const navigate = useNavigate();
  const [game] = useState(new Chess());
  const { sendMessage, lastMessage } = useWebSocketContext();
  const { publicKey } = useWallet();

  // Sound references
  const moveSoundRef = useRef<HTMLAudioElement | null>(null);
  const captureSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements
  useEffect(() => {
    moveSoundRef.current = new Audio(MOVE_SOUND_SRC);
    captureSoundRef.current = new Audio(CAPTURE_SOUND_SRC);

    // Preload audio files
    moveSoundRef.current.load();
    captureSoundRef.current.load();

    return () => {
      // Clean up
      if (moveSoundRef.current) {
        moveSoundRef.current.pause();
        moveSoundRef.current = null;
      }
      if (captureSoundRef.current) {
        captureSoundRef.current.pause();
        captureSoundRef.current = null;
      }
    };
  }, []);

  // Play sound function
  const playSound = useCallback((isCapture: boolean) => {
    try {
      if (isCapture && captureSoundRef.current) {
        captureSoundRef.current.currentTime = 0;
        captureSoundRef.current.play();
      } else if (moveSoundRef.current) {
        moveSoundRef.current.currentTime = 0;
        moveSoundRef.current.play();
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, []);

  const moveHighlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const gameState = useChessGameStore((state) => state.gameState);
  const updateGameState = useChessGameStore((state) => state.updateGameState);

  // Define constants
  const gameId = gameState?.gameId;
  const playerColor = (gameState?.playerColor || null) as Color | null;
  const playerWalletAddress = gameState?.playerWalletAddress;
  const isSpectator =
    gameState?.roomType === LocalStorageRoomTypeEnum.SPECTATOR;

  const [walletAddress, setWalletAddress] = useState(playerWalletAddress);

  // update wallet address on page load
  useEffect(() => {
    if (!walletAddress && publicKey) {
      setWalletAddress(publicKey?.toBase58() || "");
    }
  }, [publicKey]);

  const boardOrientationRef = useRef<"w" | "b">(
    (playerColor as "w" | "b") || "w"
  );

  const stablePlayerColor = boardOrientationRef.current;

  // fetch game details from memory and check if game ended
  const { data: retrievedGameDetails, isLoading: isLoadingGameDetails } =
    useGetData<IGetGameDataMemResponse>(
      API_PATHS.gameFromDbData(gameId!),
      ["gameDetails", gameId!],
      {
        enabled: !!gameId,
      }
    );

  // Clean up move highlight timeout on unmount
  useEffect(() => {
    return () => {
      if (moveHighlightTimeoutRef.current) {
        clearTimeout(moveHighlightTimeoutRef.current);
      }
    };
  }, []);

  // On mount, handle reconnection if needed
  useEffect(() => {
    if (!gameId) {
      return;
    }

    // check if game is ended
    if (gameState.isEnded) {
      updateGameState({
        gameStatus: "Game is ended, proceed to creating a new game",
      });
      return;
    }

    // Create reconnect message
    const reconnectMessage: IWSReconnectMessage = {
      type: WebSocketMessageTypeEnum.Reconnect,
      gameId: gameId,
      walletAddress: walletAddress!,
    };

    // sleep for 2 seconds so that websocket can initiate
    setTimeout(() => {
      if (walletAddress && gameId) {
        sendMessage(JSON.stringify(reconnectMessage));
      }
    }, 2000);

    // Update UI to show reconnection attempt
    // setGameState((prev) => ({
    //   ...prev,
    //   gameStatus: "Attempting to reconnect...",
    // }));
    updateGameState({
      gameStatus: "Attempting to reconnect...",
    });
  }, [navigate]);

  // --- Helper: Format Game Ended Message ---
  function processGameEndedMessage(endedMsg: IWSGameEndedMessage): {
    winner: Color | "draw" | null;
    statusText: string;
  } {
    let statusText = "Game Over!";
    let winner: Color | "draw" | null = null;

    if (endedMsg.winnerColor === null) {
      statusText = "Game ended. Draw!";
      winner = "draw";
    } else if (endedMsg.reason === "checkmate") {
      winner = endedMsg.winnerColor;
      statusText = `Checkmate! ${winner === "w" ? "White" : "Black"} wins`;
    } else if (endedMsg.reason === "resignation") {
      winner = endedMsg.winnerColor;
      statusText = `${winner === "w" ? "White" : "Black"} wins by resignation`;
    } else if (endedMsg.reason === "timeout") {
      winner = endedMsg.winnerColor;
      statusText = `${winner === "w" ? "White" : "Black"} wins on time`;
    } else if (
      [
        "draw",
        "stalemate",
        "insufficient_material",
        "threefold_repetition",
      ].includes(endedMsg.reason)
    ) {
      statusText = `Draw by ${endedMsg.reason.replace("_", " ")}!`;
      winner = "draw";
    } else {
      winner = endedMsg.winner as Color | "draw" | null;
      statusText = `Game ended. ${endedMsg.winner} wins. Reason: ${endedMsg.reason}`;
    }
    return { winner, statusText };
  }

  // Helper function to check if a move is a capture
  const isCaptureMove = (move: { captured?: string }): boolean => {
    return Boolean(move.captured);
  };

  // --- Keepalive Ping ---
  // Effect: Sends a {type: "ping"} message every 25 seconds to keep the WebSocket alive
  useEffect(() => {
    const interval = setInterval(() => {
      sendMessage(JSON.stringify({ type: "ping" }));
    }, 25000);
    return () => clearInterval(interval);
  }, [sendMessage]);

  // --- Move Pending State ---
  // Effect: Prevents user from making another move until backend confirms
  const [isMovePending, setIsMovePending] = useState(false);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage?.data) {
      return;
    }

    try {
      const messageData = JSON.parse(lastMessage.data);

      switch (messageData.type) {
        case WebSocketMessageTypeEnum.Move: {
          // --- Clear move pending state when backend confirms move ---
          setIsMovePending(false);
          const moveMsg = messageData as IWSMoveBroadcast;

          if (moveMsg.fen && moveMsg.lastMove) {
            const prevFen = game.fen();
            // Load the new position
            game.load(moveMsg.fen);

            // Determine if this was a capture by checking the move history
            const didCaptureOccur = helperUtil.didCaptureOccur(
              prevFen,
              moveMsg.fen
            );

            // Play appropriate sound if it's opponent's move
            if (game.turn() === stablePlayerColor) {
              // It's our turn now, meaning opponent just moved
              playSound(didCaptureOccur);
            }

            const newCapturedPieces = calculateCapturedPieces(game.board());

            // Ensure we have a valid lastMove with from and to properties
            let lastMove: { from: Square; to: Square } | null = null;
            if (typeof moveMsg.lastMove === "string") {
              lastMove = {
                from: moveMsg.lastMove.substring(0, 2) as Square,
                to: moveMsg.lastMove.substring(2, 4) as Square,
              };
            } else {
              lastMove = moveMsg.lastMove as { from: Square; to: Square };
            }

            updateGameState({
              fen: game.fen(),
              playerTurn: game.turn() as Color,
              moveHistory: game.history(),
              lastMove: lastMove,
              moveHighlight: lastMove, // Ensure this is set correctly
              capturedPieces: newCapturedPieces,
              selectedSquare: null,
              validMoves: [],
              gameStatus:
                game.turn() === stablePlayerColor
                  ? "Your turn to move"
                  : `Waiting for ${
                      game.turn() === "w" ? "white" : "black"
                    } to move`,
            });

            // Clear any previous timeout and set a new one
            if (moveHighlightTimeoutRef.current) {
              clearTimeout(moveHighlightTimeoutRef.current);
            }

            // Longer timeout (4 seconds)
            moveHighlightTimeoutRef.current = setTimeout(() => {
              updateGameState({
                moveHighlight: null,
              });
            }, 4000); // Increased to 4 seconds
          }
          break;
        }

        case WebSocketMessageTypeEnum.GameEnded: {
          const endedMsg = messageData as IWSGameEndedMessage;
          const { winner, statusText } = processGameEndedMessage(endedMsg);

          updateGameState({
            winner,
            gameStatus: statusText,
            isEnded: true,
          });
          break;
        }

        case WebSocketMessageTypeEnum.Joined: {
          const joinedMsg = messageData as IWSJoinedMessage;

          if (joinedMsg.gameId === gameId) {
            if (joinedMsg.fen) {
              game.load(joinedMsg.fen);
              const initialCapturedPieces = calculateCapturedPieces(
                game.board()
              );

              updateGameState({
                fen: game.fen(),
                playerTurn: game.turn() as Color,
                moveHistory: game.history(),
                duration: joinedMsg?.duration || gameState?.duration,
                capturedPieces: initialCapturedPieces,
                gameStatus:
                  game.turn() === stablePlayerColor
                    ? "Your turn to move"
                    : `Waiting for ${
                        game.turn() === "w" ? "white" : "black"
                      } to move`,
              });
            }
          }
          break;
        }

        case WebSocketMessageTypeEnum.Reconnected: {
          const reconnectedMsg = messageData as IWSReconnectedMessage;

          // Load the returned game state
          if (reconnectedMsg.fen) {
            game.load(reconnectedMsg.fen);
            const newCapturedPieces = calculateCapturedPieces(game.board());

            updateGameState({
              fen: game.fen(),
              playerTurn: game.turn() as Color,
              moveHistory: game.history(),
              capturedPieces: newCapturedPieces,
              gameStatus: game.isGameOver()
                ? `Game ${reconnectedMsg.status}`
                : game.turn() === stablePlayerColor
                ? "Your turn to move"
                : `Waiting for ${
                    game.turn() === "w" ? "white" : "black"
                  } to move`,
            });
          }
          break;
        }

        case WebSocketMessageTypeEnum.ViewingGame: {
          const viewingMsg = messageData as IWSViewingGameMessage;
          if (viewingMsg.fen) {
            game.load(viewingMsg.fen);
            updateGameState({
              fen: game.fen(),
              playerTurn: game.turn() as Color,
            });
          }
          break;
        }

        case WebSocketMessageTypeEnum.Error: {
          const errorMsg = messageData as IWSErrorMessage;
          // check if game ended
          if (errorMsg.message.includes("Game no longer exists")) {
            console.log("game ended");
          }
          toast.error(`Game Error: ${errorMsg.message}`);
          break;
        }
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message:", err);
      // --- Also clear move pending on error ---
      setIsMovePending(false);
    }
  }, [lastMessage, game, gameId, playerColor, playSound, stablePlayerColor]);

  // --- Spectator: Send viewGame message on mount ---
  useEffect(() => {
    if (isSpectator && gameId) {
      setTimeout(() => {
        sendMessage(
          JSON.stringify({
            type: WebSocketMessageTypeEnum.ViewGame,
            gameId,
          })
        );
        updateGameState({ gameStatus: "Spectating game..." });
      }, 1000); // 1 second delay
    }
  }, [isSpectator, gameId, sendMessage, updateGameState]);

  // --- Spectator: Disable all board interactions ---
  const handleSquareClick = useCallback(
    (square: Square) => {
      if (isSpectator) {
        // Spectators cannot interact with the board
        return;
      }
      // --- Prevent move if waiting for backend ---
      if (isMovePending) {
        toast.info("Waiting for server response...");
        return;
      }

      // check game is not ended
      if (gameState.isEnded) {
        toast.info("Game is ended, proceed to creating a new game");
        return;
      }

      // Early validation - check if it's the player's turn
      const isPlayersTurn = stablePlayerColor === gameState.playerTurn;

      // check if game is active
      if (gameState.winner || game.isGameOver() || !stablePlayerColor) {
        return;
      }

      // Validate it's the player's turn before any interaction
      if (!isPlayersTurn) {
        toast.error("Wait for your turn!");
        return;
      }

      // Now continue with piece selection and move logic
      if (!gameState.selectedSquare) {
        const piece = game.get(square);

        // Check if the selected piece belongs to the player
        if (piece?.color === stablePlayerColor) {
          const legalMoves = game.moves({
            square,
            verbose: true,
          });

          updateGameState({
            selectedSquare: square,
            validMoves: legalMoves.map((m) => m.to as Square),
          });
        } else if (piece) {
          // If player selected opponent's piece
          toast.error("You can only move your own pieces!");
        }
      } else {
        if (gameState?.validMoves?.includes(square)) {
          try {
            const initialFen = game.fen();
            const move = game.move({
              from: gameState.selectedSquare,
              to: square,
              promotion: "q", // Always promote to queen for simplicity
            });

            if (move && gameId) {
              // Play sound for our own move
              playSound(isCaptureMove(move));

              const moveMessage: IWSMoveMessage = {
                type: WebSocketMessageTypeEnum.Move,
                gameId,
                fen: game.fen(),
                initialFen,
                walletAddress: walletAddress!,
                move: `${move.from}${move.to}`,
              };

              // --- Send move message to the server ---
              sendMessage(JSON.stringify(moveMessage));

              // --- Set move pending, do NOT update board/UI yet ---
              setIsMovePending(true);

              // --- Do NOT updateGameState here; wait for backend Move broadcast ---

              // --- Clear any previous timeout and set a new one (optional, for UI feedback) ---
              if (moveHighlightTimeoutRef.current) {
                clearTimeout(moveHighlightTimeoutRef.current);
              }
            }
          } catch (error) {
            console.error("Move error:", error);
            toast.error("Invalid move!");
            setIsMovePending(false);
          }
        }

        updateGameState({
          selectedSquare: null,
          validMoves: [],
        });
      }
    },
    [
      game,
      gameState.selectedSquare,
      gameState.validMoves,
      gameState.winner,
      gameState.playerTurn,
      stablePlayerColor,
      gameId,
      sendMessage,
      walletAddress,
      moveHighlightTimeoutRef,
      playSound,
      isMovePending,
      isSpectator,
      gameState.isEnded,
      gameState,
      updateGameState,
      toast,
    ]
  );

  // --- Spectator: If game not found or deleted, show error and return to Ongoing Games ---
  useEffect(() => {
    if (!isLoadingGameDetails && !retrievedGameDetails && isSpectator) {
      toast.error("Game not found or has ended.");
      navigate(PAGE_ROUTES.OngoingGames);
    }
  }, [isLoadingGameDetails, retrievedGameDetails, isSpectator, navigate]);

  // Render chess board
  const renderBoard = () => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    // ALWAYS use the ref for orientation, never use playerColor directly for board display
    const boardOrientation = boardOrientationRef.current;

    const displayRanks =
      boardOrientation === "b" ? [...ranks].reverse() : ranks;
    const displayFiles =
      boardOrientation === "b" ? [...files].reverse() : files;

    const position = game.board();

    return (
      <div className="relative grid grid-cols-8 gap-0 border-4 border-amber-900/50 rounded-xl overflow-hidden shadow-2xl">
        {displayRanks.map((rank, rankIndex) =>
          displayFiles.map((file, fileIndex) => {
            const square = `${file}${rank}` as Square;
            // Use the stable orientation for position mapping too
            const piece =
              position[boardOrientation === "b" ? 7 - rankIndex : rankIndex][
                boardOrientation === "b" ? 7 - fileIndex : fileIndex
              ];
            const isLight = (rankIndex + fileIndex) % 2 === 0;
            const isSelected = square === gameState.selectedSquare;
            const isValidMove = gameState?.validMoves?.includes(square);
            const isLastMove =
              gameState.lastMove &&
              (square === gameState.lastMove.from ||
                square === gameState.lastMove.to);

            // More prominent highlight colors and effects
            const isHighlightFrom =
              gameState.moveHighlight &&
              square === gameState.moveHighlight.from;
            const isHighlightTo =
              gameState.moveHighlight && square === gameState.moveHighlight.to;

            return (
              <div
                key={square}
                className={`
                  relative aspect-square cursor-pointer
                  ${isLight ? "bg-amber-100" : "bg-amber-800"}
                  ${isSelected ? "ring-4 ring-yellow-400 z-10" : ""}
                  ${
                    isValidMove
                      ? piece
                        ? "ring-4 ring-red-500 z-10"
                        : "after:content-[''] after:absolute after:inset-0 after:m-auto after:w-3 after:h-3 after:rounded-full after:bg-gray-500/60"
                      : ""
                  }
                  ${
                    isLastMove && !isHighlightFrom && !isHighlightTo
                      ? "bg-yellow-400/30"
                      : ""
                  }
                  ${
                    isHighlightFrom
                      ? "bg-blue-500/40 ring-4 ring-blue-600 z-20"
                      : ""
                  }
                  ${
                    isHighlightTo
                      ? "bg-blue-600/40 ring-4 ring-blue-500 z-20"
                      : ""
                  }
                  transition-all duration-200
                `}
                onClick={() => handleSquareClick(square)}
              >
                {/* Coordinates */}
                {fileIndex === 0 && (
                  <span className="absolute left-1 top-0 text-xs font-bold opacity-60">
                    {rank}
                  </span>
                )}
                {rankIndex === 7 && (
                  <span className="absolute right-1 bottom-0 text-xs font-bold opacity-60">
                    {file}
                  </span>
                )}

                {/* Piece */}
                {piece && (
                  <motion.div
                    key={`${piece.color}${piece.type}-${square}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <img
                      src={`https://www.chess.com/chess-themes/pieces/neo/150/${piece.color}${piece.type}.png`}
                      alt={`${piece.color}${piece.type}`}
                      className="w-4/5 h-4/5 object-contain"
                      draggable={false}
                    />
                  </motion.div>
                )}

                {/* Enhanced pulsing effect on highlighted squares */}
                {(isHighlightFrom || isHighlightTo) && (
                  <motion.div
                    className={`absolute inset-0 ${
                      isHighlightFrom ? "bg-blue-400/50" : "bg-blue-500/50"
                    } z-5`}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0.5, 0.9, 0.5],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: 2, // More pulses
                      repeatType: "reverse",
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const [showResignDialog, setShowResignDialog] = useState(false);
  const resignSentRef = useRef(false);

  // --- Resign logic ---
  const handleResign = useCallback(() => {
    if (
      !gameId ||
      !walletAddress ||
      gameState.isEnded ||
      resignSentRef.current
    ) {
      return;
    }
    resignSentRef.current = true;
    const resignMsg = {
      type: WebSocketMessageTypeEnum.Resign,
      gameId,
      walletAddress,
    };
    sendMessage(JSON.stringify(resignMsg));

    updateGameState({
      isEnded: true,
      winner: stablePlayerColor === "w" ? "b" : "w", // Opponent wins
      gameStatus: "You resigned. Game ended.",
    });

    setShowResignDialog(false);
  }, [
    gameId,
    walletAddress,
    gameState.isEnded,
    sendMessage,
    stablePlayerColor,
  ]);

  // --- Timer logic: only decrement current player's timer when game is ongoing ---
  useEffect(() => {
    if (gameState.isEnded) return;

    const interval = setInterval(() => {
      let wRemainingTime = gameState.whitePlayerTimerInMilliseconds;
      let bRemainingTime = gameState.blackPlayerTimerInMilliseconds;

      if (gameState.playerTurn === "w") {
        wRemainingTime = Math.max(0, wRemainingTime - 1000);
      } else {
        bRemainingTime = Math.max(0, bRemainingTime - 1000);
      }

      // if timer hits zero and it's current user turn to play , then auto resign
      if (
        gameState.playerTurn === stablePlayerColor &&
        !gameState.isEnded &&
        (wRemainingTime <= 0 || bRemainingTime <= 0)
      ) {
        handleResign();
      }

      updateGameState({
        whitePlayerTimerInMilliseconds: wRemainingTime,
        blackPlayerTimerInMilliseconds: bRemainingTime,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [
    gameState,
    gameState.playerTurn,
    gameState.isEnded,
    handleResign,
    stablePlayerColor,
  ]);

  useEffect(() => {
    if (gameState && gameState.fen) {
      game.load(gameState.fen);
    }
  }, []);

  const [showChat, setShowChat] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Show loading screen if game details are still loading
  if (isLoadingGameDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-black">
        <LoaderWithInnerLoader text="Loading game details..." />
      </div>
    );
  }

  // Show error screen if game details are not found
  if (!isLoadingGameDetails && !retrievedGameDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-950 to-black">
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
          <span className="text-3xl font-bold text-red-500 mb-2">
            Game Not Found
          </span>
          <span className="text-lg text-white/80 mb-6">
            The game you are looking for does not exist or has ended.
          </span>
          <button
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2 rounded-lg shadow transition-all cursor-pointer"
            onClick={() => navigate(PAGE_ROUTES.OngoingGames)}
          >
            Return to games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white">
      {/* Chat Dropdown Overlay: Spectators see chat as read-only or hidden if not allowed */}
      <ChatDropdown
        gameId={String(gameId)}
        walletAddress={String(walletAddress)}
        open={showChat}
        onOpenChange={setShowChat}
        onUnreadMessage={setUnreadMessagesCount}
        readOnly={isSpectator} // Pass readOnly prop for spectators
      />
      {/* Background effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-800/10 rounded-full filter blur-3xl" />
      </div>
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-4 sm:py-8 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/games")}
            className="text-gray-300 hover:text-black self-start cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>
          <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-auto">
            {/* --- Hide chat and resign for spectators --- */}
            {!isSpectator && (
              <>
                <Button
                  variant="outline"
                  className={`gap-1 sm:gap-2 text-black cursor-pointer text-xs sm:text-sm relative`}
                  size="sm"
                  onClick={() => setShowChat(true)}
                  aria-label="Open chat"
                >
                  <span
                    className="absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full shadow-lg z-10 px-1.5 border-2 border-white"
                    aria-label={`${unreadMessagesCount} unread messages`}
                  >
                    {unreadMessagesCount}
                  </span>
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </Button>
                {/* Resign Dialog */}
                <AlertDialog
                  open={showResignDialog}
                  onOpenChange={setShowResignDialog}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className={`gap-1 sm:gap-2 cursor-pointer text-xs sm:text-sm`}
                      size="sm"
                      onClick={() => setShowResignDialog(true)}
                      disabled={gameState.isEnded}
                    >
                      Resign
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Resignation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to resign? This will end the game
                        and your opponent will be declared the winner.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setShowResignDialog(false)}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleResign} autoFocus>
                        Yes, Resign
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>

        {/* Game Status */}
        <div className="text-center mb-4 sm:mb-8">
          <span
            className={`
              px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium
              ${
                gameState.winner
                  ? "bg-green-600/80"
                  : gameState.gameStatus.includes("turn")
                  ? "bg-amber-600/80"
                  : gameState.gameStatus.includes("Check")
                  ? "bg-red-600/80"
                  : "bg-gray-800/80"
              }
            `}
          >
            {gameState.gameStatus}
          </span>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-8 items-start flex-grow">
          <PlayerPanel color="b" />

          {/* Chess Board */}
          <div className="relative w-full max-w-md sm:max-w-lg md:max-w-xl mx-auto lg:w-auto">
            <AnimatePresence>
              {gameState.winner && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 rounded-xl backdrop-blur-sm"
                >
                  <div className="text-center p-4 sm:p-8">
                    <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 mx-auto mb-3 sm:mb-4" />
                    <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">
                      {gameState.gameStatus}
                    </h2>
                    <Button
                      onClick={() => navigate("/games")}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 text-sm"
                    >
                      Back to Lobby
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {renderBoard()}

            {/* FEN Display */}
            <div className="mt-2 sm:mt-4 text-xs text-gray-400 text-center break-all">
              <span className="font-mono bg-black/40 p-1 sm:p-2 rounded select-all">
                {gameState.fen}
              </span>
            </div>
          </div>

          <PlayerPanel color="w" />
        </div>
      </div>
    </div>
  );
}

export default HumanVsHumanV2;
