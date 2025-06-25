import { useCallback, useEffect, useState, useRef } from "react";
import { Chess, Square, Color } from "chess.js";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Flag, HandshakeIcon } from "lucide-react";
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
import { PromotionModal } from "../../components/game/PromotionModal";
import { VictoryOverlay } from "../../components/game/VictoryOverlay";
import { useBreakpoint } from "../../context/BreakpointContext";

// Sound files
const MOVE_SOUND_SRC = "/move-sound.wav";
const CAPTURE_SOUND_SRC = "/capture-sound.wav";

export function HumanVsHumanV2() {
  const navigate = useNavigate();
  const [game] = useState(new Chess());
  const { sendMessage, lastMessage } = useWebSocketContext();
  const { publicKey } = useWallet();
  const { isMobile } = useBreakpoint();

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
      API_PATHS.getInMemGameDetails(gameId!),
      ["gameDetails", gameId!]
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

    // Update game state to show reconnecting status
    updateGameState({
      gameStatus: "Attempting to reconnect...",
    });

    // sleep for 2 seconds so that websocket can initiate
    setTimeout(() => {
      if (walletAddress && gameId) {
        sendMessage(JSON.stringify(reconnectMessage));
      }
    }, 2000);
  }, [navigate]);

  // Effect: Prevents user from making another move until backend confirms
  const [isMovePending, setIsMovePending] = useState(false);

  // --- Promotion State ---
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage?.data) {
      return;
    }

    try {
      const messageData = JSON.parse(lastMessage.data);

      // handle move response
      if (messageData.type === WebSocketMessageTypeEnum.Move) {
        // Clear move pending state when backend confirms move
        setIsMovePending(false);

        const moveMsg = messageData as IWSMoveBroadcast;

        if (moveMsg.fen && moveMsg.lastMove) {
          // keep track of the prev fen
          const prevFen = game.fen();

          // Load the new position
          game.load(moveMsg.fen);

          // Determine if this was a capture by checking the move history
          const didCaptureOccur = helperUtil.didCaptureOccur(
            prevFen,
            moveMsg.fen
          );

          // Play sound for moves
          playSound(didCaptureOccur);

          const newCapturedPieces = calculateCapturedPieces(game.board());

          // Ensure we have a valid lastMove with from and to properties
          const lastMove = {
            from: moveMsg.lastMove.substring(0, 2) as Square,
            to: moveMsg.lastMove.substring(2, 4) as Square,
          };

          updateGameState({
            fen: game.fen(),
            playerTurn: game.turn() as Color,
            moveHistory: game.history(),
            lastMove: lastMove,
            moveHighlight: lastMove, // Ensure this is set correctly
            capturedPieces: newCapturedPieces,
            selectedSquare: null,
            validMoves: [],
            gameStatus: (() => {
              const currentTurn = game.turn();
              if (currentTurn === stablePlayerColor) {
                return "Your turn to move";
              } else {
                return `Waiting for ${helperUtil.mapTurnToName(
                  currentTurn
                )} to move`;
              }
            })(),
          });

          // Clear any previous timeout and set a new one
          if (moveHighlightTimeoutRef.current) {
            clearTimeout(moveHighlightTimeoutRef.current);
          }

          // Clear move highlight after 4 seconds
          moveHighlightTimeoutRef.current = setTimeout(() => {
            updateGameState({
              moveHighlight: null,
            });
          }, 4000);
        }
      }

      // handle game ended response
      if (messageData.type === WebSocketMessageTypeEnum.GameEnded) {
        const endedMsg = messageData as IWSGameEndedMessage;

        let winner: Color | "draw" | null = null;
        let statusMessage = "Game Over, no winner!";

        if (endedMsg.winnerColor === null) {
          statusMessage = "Game ended in a draw";
          winner = "draw";
        } else if (endedMsg.reason === "checkmate") {
          winner = endedMsg.winnerColor;
          statusMessage = `Checkmate! ${
            winner === "w" ? "White" : "Black"
          } wins`;
        } else if (endedMsg.reason === "resignation") {
          winner = endedMsg.winnerColor;
          statusMessage = `${winner === "w" ? "Black" : "White"} resigned, ${
            winner === "w" ? "White" : "Black"
          } wins`;
        } else if (endedMsg.reason === "timeout") {
          winner = endedMsg.winnerColor;
          statusMessage = `${winner === "w" ? "White" : "Black"} wins on time`;
        } else if (
          [
            "draw",
            "stalemate",
            "insufficient_material",
            "threefold_repetition",
          ].includes(endedMsg.reason)
        ) {
          statusMessage = `Draw by ${endedMsg.reason.replace("_", " ")}!`;
          winner = "draw";
        } else {
          winner = endedMsg.winner as Color | "draw" | null;
          statusMessage = `Game ended. ${endedMsg.winner} wins. Reason: ${endedMsg.reason}`;
        }

        updateGameState({
          winner: endedMsg.winnerColor,
          gameStatus: statusMessage,
          isEnded: true,
        });
      }

      // handle joined response
      if (messageData.type === WebSocketMessageTypeEnum.Joined) {
        const joinedMsg = messageData as IWSJoinedMessage;

        if (joinedMsg.gameId === gameId && joinedMsg.fen) {
          game.load(joinedMsg.fen);
          const initialCapturedPieces = calculateCapturedPieces(game.board());

          updateGameState({
            fen: game.fen(),
            playerTurn: game.turn() as Color,
            moveHistory: game.history(),
            duration: joinedMsg?.duration || gameState?.duration,
            capturedPieces: initialCapturedPieces,
            gameStatus:
              game.turn() === stablePlayerColor
                ? "Your turn to move"
                : `Waiting for ${helperUtil.mapTurnToName(
                    game.turn()
                  )} to move`,
          });
        }
      }

      // handle viewing game response
      if (messageData.type === WebSocketMessageTypeEnum.ViewingGame) {
        const viewingMsg = messageData as IWSViewingGameMessage;
        if (viewingMsg.fen) {
          game.load(viewingMsg.fen);
          updateGameState({
            fen: game.fen(),
            playerTurn: game.turn() as Color,
          });
        }
      }

      // handle reconnect
      if (messageData.type === WebSocketMessageTypeEnum.Reconnected) {
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
            gameStatus: (() => {
              const isGameOver = game.isGameOver();
              const currentTurn = game.turn();

              if (isGameOver) {
                return `Game ${reconnectedMsg.status}`;
              } else if (currentTurn === stablePlayerColor) {
                return "Your turn to move";
              } else {
                return `Waiting for ${helperUtil.mapTurnToName(
                  currentTurn
                )} to move`;
              }
            })(),
          });
        }
      }

      // handle error
      if (messageData.type === WebSocketMessageTypeEnum.Error) {
        const errorMsg = messageData as IWSErrorMessage;
        // check if game ended
        if (errorMsg.message.includes("Game no longer exists")) {
          console.log("game ended");
        }
        toast.error(`Game Error: ${errorMsg.message}`);
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message:", err);
      // clear move pending on error
      setIsMovePending(false);
    }
  }, [lastMessage, game, gameId, playerColor, playSound, stablePlayerColor]);

  // Spectator: Send viewGame message on mount
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

  // --- Check if move is a pawn promotion ---
  const isPromotionMove = useCallback(
    (from: string, to: string): boolean => {
      try {
        const piece = game.get(from as Square);
        if (!piece || piece.type !== "p") return false;

        const toRank = to[1];
        return (
          (piece.color === "w" && toRank === "8") ||
          (piece.color === "b" && toRank === "1")
        );
      } catch {
        return false;
      }
    },
    [game]
  );

  // --- Handle Promotion Piece Selection ---
  const handlePromotionSelect = useCallback(
    (piece: "q" | "r" | "b" | "n") => {
      if (!pendingPromotion || !gameId) return;

      try {
        const initialFen = game.fen();
        const move = game.move({
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          promotion: piece,
        });

        if (move) {
          const moveMessage: IWSMoveMessage = {
            type: WebSocketMessageTypeEnum.Move,
            gameId,
            fen: game.fen(),
            initialFen,
            walletAddress: walletAddress!,
            move: `${move.from}${move.to}${piece}`, // Include promotion piece
          };

          sendMessage(JSON.stringify(moveMessage));
          setIsMovePending(true);

          if (moveHighlightTimeoutRef.current) {
            clearTimeout(moveHighlightTimeoutRef.current);
          }
        }
      } catch (error) {
        console.error("Promotion move error:", error);
        toast.error("Invalid promotion move!");
        setIsMovePending(false);
      } finally {
        setPendingPromotion(null);
        updateGameState({
          selectedSquare: null,
          validMoves: [],
        });
      }
    },
    [
      pendingPromotion,
      gameId,
      game,
      walletAddress,
      sendMessage,
      updateGameState,
    ]
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      // Spectators cannot interact with the board
      if (isSpectator) {
        return;
      }
      // Prevent move if waiting for backend or promotion pending
      if (isMovePending || pendingPromotion) {
        if (isMovePending) toast.info("Waiting for server response...");
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
          // Check if this is a promotion move
          if (isPromotionMove(gameState.selectedSquare, square)) {
            // Test if the move is valid by creating a temporary game
            const tempGame = new Chess(game.fen());
            try {
              tempGame.move({
                from: gameState.selectedSquare,
                to: square,
                promotion: "q", // Test with queen
              });
              // Move is valid, show promotion modal
              setPendingPromotion({
                from: gameState.selectedSquare,
                to: square,
              });
              return;
            } catch {
              // Move is invalid, continue with normal move handling
            }
          }

          try {
            const initialFen = game.fen();
            const move = game.move({
              from: gameState.selectedSquare,
              to: square,
            });

            if (move && gameId) {
              const moveMessage: IWSMoveMessage = {
                type: WebSocketMessageTypeEnum.Move,
                gameId,
                fen: game.fen(),
                initialFen,
                walletAddress: walletAddress!,
                move: `${move.from}${move.to}`,
              };

              //  Send move message to the server
              sendMessage(JSON.stringify(moveMessage));

              //  Set move pending, do NOT update board/UI yet
              setIsMovePending(true);

              //  Do NOT updateGameState here; wait for backend Move broadcast

              //  Clear any previous timeout and set a new one (optional, for UI feedback)
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

  // Spectator: If game not found or deleted, show error and return to Ongoing Games
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

  // Resign logic
  const handleResign = useCallback(() => {
    if (
      !gameId ||
      !walletAddress ||
      gameState.isEnded ||
      resignSentRef.current ||
      isSpectator
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

  //Timer logic: only decrement current player's timer when game is ongoing
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

  const getCapturedPieces = (color: string) =>
    gameState.capturedPieces?.[color === "w" ? "b" : "w"] || [];

  const renderCapturedPieces = (color: string) => {
    const capturedPieces = getCapturedPieces(color);
    {
      return (
        <div className="flex flex-wrap my-1">
          {capturedPieces.map((piece) => (
            <div className="w-5 h-5 md:w-6 md:h-6">
              <img
                src={`https://www.chess.com/chess-themes/pieces/neo/150/${piece.color}${piece.type}.png`}
                alt={`${piece.color}${piece.type}`}
                className="w-full h-full object-contain opacity-75"
              />
            </div>
          ))}
        </div>
      );
    }
  };

  // State for draw dialog
  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const drawSentRef = useRef(false);

  // Draw offer logic
  const handleDrawOffer = useCallback(() => {
    if (
      !gameId ||
      !walletAddress ||
      gameState.isEnded ||
      drawSentRef.current ||
      isSpectator
    ) {
      return;
    }
    drawSentRef.current = true;
    const drawMsg = {
      type: WebSocketMessageTypeEnum.Draw,
      gameId,
      walletAddress,
    };
    sendMessage(JSON.stringify(drawMsg));
    toast.info("Draw offer sent. Waiting for opponent's response.");
    setShowDrawDialog(false);
  }, [gameId, walletAddress, gameState.isEnded, sendMessage, isSpectator]);

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
    <div className="min-h-screen max-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white ">
      {/* Chat Dropdown Modal start */}
      <ChatDropdown
        gameId={String(gameId)}
        walletAddress={String(walletAddress)}
        open={showChat}
        onOpenChange={setShowChat}
        onUnreadMessage={setUnreadMessagesCount}
        readOnly={isSpectator} // Pass readOnly prop for spectators
      />
      {/* Chat Dropdown Modal end */}

      {/* Promotion Modal start */}
      <PromotionModal
        isOpen={!!pendingPromotion}
        playerColor={stablePlayerColor}
        onPieceSelect={handlePromotionSelect}
      />
      {/* Promotion Modal end */}

      {/* Resign Dialog start */}
      <AlertDialog open={showResignDialog} onOpenChange={setShowResignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Resignation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to resign? This will end the game and your
              opponent will be declared the winner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowResignDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResign}
              autoFocus
              className="cursor-pointer"
            >
              Yes, Resign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Resign Dialog end */}

      {/* Draw Dialog start */}
      <AlertDialog open={showDrawDialog} onOpenChange={setShowDrawDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Offer Draw</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to offer a draw? If your opponent accepts,
              the game will end as a draw.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowDrawDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDrawOffer}
              autoFocus
              className="cursor-pointer"
            >
              Yes, Offer Draw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Draw Dialog end */}

      {/* Victory Overlay */}
      <VictoryOverlay
        isVisible={gameState.isEnded}
        winner={gameState.winner}
        playerColor={stablePlayerColor}
        gameStatus={gameState.gameStatus}
      />

      {/* Content */}
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 flex flex-col max-h-[100vh] min-h-[calc(100vh-100px)]">
        {/* Header start */}
        <div
          className={`relative w-full flex items-center justify-between mb-1 ${
            isMobile ? "mt-2" : ""
          }`}
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/games")}
            className="flex items-center text-gray-300 p-2 h-auto space-x-2"
            size="sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>

          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl shadow-lg px-4 py-2 text-center">
              <span className="text-sm sm:text-base text-center font-medium text-white/90">
                {gameState.gameStatus}
              </span>
            </div>
          </div>
        </div>
        {/* Header end */}

        {/* Players Panel start */}
        {isMobile ? (
          <div className="flex flex-col items-center justify-center mt-2">
            <div className="w-full">
              <PlayerPanel color="b" />
            </div>
            <div className="mt-2 w-full">
              <PlayerPanel color="w" />
            </div>
          </div>
        ) : (
          // Desktop
          <div className="flex-none flex items-center justify-between gap-4 mt-2">
            <div className="w-full sm:w-auto sm:flex-1 min-w-0">
              <PlayerPanel color="b" />
            </div>
            <div className="w-full sm:w-auto sm:flex-1 min-w-0">
              <PlayerPanel color="w" />
            </div>
          </div>
        )}
        {/* Players Panel end */}

        {/* chess board start */}
        <div className="flex-1 flex flex-col justify-center min-h-0 gap-1 sm:gap-2">
          <div className="flex-none flex justify-center h-6 sm:h-8">
            {renderCapturedPieces(gameState.playerColor == "b" ? "w" : "b")}
          </div>

          <div className="flex-none w-full max-w-[min(90vw,50vh,500px)] aspect-square mx-auto">
            {renderBoard()}
          </div>

          <div className="flex-none flex justify-center h-6 sm:h-8">
            {renderCapturedPieces(gameState.playerColor == "w" ? "w" : "b")}
          </div>
        </div>
        {/* chess board end */}

        {/* Game action buttons start */}
        {!isSpectator && !gameState.isEnded && (
          <div className="flex justify-center items-center mt-2 sm:mt-4 mb-1">
            <div className="bg-gray-900/80 rounded-full flex items-center px-4 py-2 space-x-4 shadow-lg border border-white/10">
              <Button
                className="relative flex items-center space-x-2 cursor-pointer bg-transparent hover:bg-transparent"
                onClick={() => setShowChat(true)}
                disabled={false}
              >
                {unreadMessagesCount > 0 && (
                  <span
                    className="absolute top-1 -left-1 min-w-[15px] h-[15px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full shadow-lg z-10 px-1.5"
                    aria-label={`${unreadMessagesCount} unread messages`}
                  >
                    {unreadMessagesCount}
                  </span>
                )}
                <MessageCircle className="w-5 h-5" />
                <span>Chat</span>
              </Button>

              <div className="h-6 border-r border-white/20"></div>

              <Button
                className="flex items-center space-x-2 cursor-pointer bg-transparent hover:bg-transparent"
                onClick={() => setShowResignDialog(true)}
              >
                <Flag className="w-5 h-5" />
                <span>Resign</span>
              </Button>

              <div className="h-6 border-r border-white/20"></div>

              <Button
                className="flex items-center space-x-2 cursor-pointer bg-transparent hover:bg-transparent"
                onClick={() => setShowDrawDialog(true)}
              >
                <HandshakeIcon className="w-5 h-5" />
                <span>Draw</span>
              </Button>
            </div>
          </div>
        )}
        {/* Game action buttons end */}
      </div>
    </div>
  );
}

export default HumanVsHumanV2;
