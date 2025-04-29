import { useCallback, useEffect, useState, useRef } from "react";
import { Chess, Square, Color } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWebSocketContext } from "../../context/useWebSocketContext";
import { localStorageHelper } from "../../utils/localStorageHelper";
import {
  LocalStorageKeysEnum,
  IGameDetailsLocalStorage,
  WebSocketMessageTypeEnum,
  IWSErrorMessage,
  IWSGameEndedMessage,
  IWSMoveBroadcast,
  IWSMoveMessage,
  IWSJoinedMessage,
  IWSReconnectMessage,
  IWSReconnectedMessage,
} from "../../utils/type";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  calculateCapturedPieces,
  formatTime,
  ICapturedPiece,
} from "../../utils/chessUtils";
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

interface IGameState {
  fen: string;
  playerTurn: Color;
  selectedSquare: Square | null;
  validMoves: Square[];
  moveHistory: string[];
  capturedPieces: {
    w: ICapturedPiece[];
    b: ICapturedPiece[];
  };
  lastMove: { from: Square; to: Square } | null;
  winner: Color | "draw" | null;
  isEnded: boolean;
  isOngoing: boolean;
  isStarted: boolean;
  gameStatus: string;
  moveHighlight: { from: Square; to: Square } | null;
  whitePlayerTimerInMilliseconds: number;
  blackPlayerTimerInMilliseconds: number;
}

export function HumanVsHumanV2() {
  const navigate = useNavigate();
  const [game] = useState(new Chess());
  const { sendMessage, lastMessage } = useWebSocketContext();
  const { publicKey } = useWallet();

  const moveHighlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get game details from localStorage, including duration
  const gameDetails = localStorageHelper.getItem(
    LocalStorageKeysEnum.GameDetails
  ) as IGameDetailsLocalStorage | null;

  const gameId = gameDetails?.gameId || null;
  const playerColor = (gameDetails?.playerColor || null) as Color | null;
  const playerWalletAddress = gameDetails?.playerWalletAddress;

  const [walletAddress, setWalletAddress] = useState(playerWalletAddress);

  // update wallet address on page load
  useEffect(() => {
    if (!walletAddress) {
      setWalletAddress(publicKey?.toBase58() || "");
    }
  }, [publicKey]);

  const boardOrientationRef = useRef<"w" | "b">(
    (playerColor as "w" | "b") || "w"
  );

  const stablePlayerColor = boardOrientationRef.current;

  // On mount, try to load saved game state
  const savedGameState = localStorageHelper.getItem(
    LocalStorageKeysEnum.GameState
  );
  const [gameState, setGameState] = useState<IGameState>(
    savedGameState && savedGameState.gameId === gameId
      ? savedGameState
      : {
          fen: gameDetails?.fen || game.fen(),
          playerTurn: "w",
          selectedSquare: null,
          validMoves: [],
          moveHistory: [],
          capturedPieces: { w: [], b: [] },
          lastMove: null,
          winner: null,
          gameStatus: "Waiting for opponent...",
          isStarted: true,
          isOngoing: true,
          moveHighlight: null,
          whitePlayerTimerInMilliseconds: gameDetails?.duration,
          blackPlayerTimerInMilliseconds: gameDetails?.duration,
        }
  );

  // Persist gameState to localStorage on every change
  useEffect(() => {
    if (gameState && gameId) {
      // Ensure we're not overwriting the player color
      const persistedState = {
        ...gameState,
        gameId,
        playerColor: playerColor, // Preserve the original player color
      };

      localStorageHelper.setItem(
        LocalStorageKeysEnum.GameState,
        persistedState
      );
    }
  }, [gameState, gameId, playerColor]);

  // Clean up game state in localStorage if gameId changes or on game end
  useEffect(() => {
    return () => {
      localStorageHelper.deleteItem(LocalStorageKeysEnum.GameState);
    };
  }, [gameId]);

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
    setGameState((prev) => ({
      ...prev,
      gameStatus: "Attempting to reconnect...",
    }));
  }, [navigate]);

  // --- Helper: Format Game Ended Message ---
  function processGameEndedMessage(
    endedMsg: IWSGameEndedMessage,
    playerColor: Color | null
  ): { winner: Color | "draw" | null; statusText: string } {
    let statusText = "Game Over!";
    let winner: Color | "draw" | null = null;

    if (endedMsg.reason === "checkmate") {
      winner = endedMsg.winner === "w" ? "w" : "b";
      statusText = `Checkmate! ${winner === "w" ? "White" : "Black"} wins`;
    } else if (endedMsg.reason === "resignation") {
      winner = endedMsg.winner === "w" ? "w" : "b";
      statusText = `${winner === "w" ? "White" : "Black"} wins by resignation`;
    } else if (endedMsg.reason === "timeout") {
      winner = endedMsg.winner === "w" ? "w" : "b";
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
      // Fallback: handle 'opponent' or unknown
      if (endedMsg.winner === "opponent" && playerColor) {
        winner = playerColor === "w" ? "b" : "w";
        statusText = `${
          winner === "w" ? "White" : "Black"
        } wins by resignation`;
      } else {
        winner = endedMsg.winner as Color | "draw" | null;
        statusText = `Game ended. ${endedMsg.winner} wins. Reason: ${endedMsg.reason}`;
      }
    }
    return { winner, statusText };
  }

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage?.data) {
      return;
    }

    try {
      const messageData = JSON.parse(lastMessage.data);

      switch (messageData.type) {
        case WebSocketMessageTypeEnum.Move: {
          const moveMsg = messageData as IWSMoveBroadcast;

          if (moveMsg.fen && moveMsg.lastMove) {
            game.load(moveMsg.fen);
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

            setGameState((prev) => ({
              ...prev,
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
            }));

            // Clear any previous timeout and set a new one
            if (moveHighlightTimeoutRef.current) {
              clearTimeout(moveHighlightTimeoutRef.current);
            }

            // Longer timeout (4 seconds)
            moveHighlightTimeoutRef.current = setTimeout(() => {
              setGameState((prev) => ({
                ...prev,
                moveHighlight: null,
              }));
            }, 4000); // Increased to 4 seconds
          }
          break;
        }

        case WebSocketMessageTypeEnum.GameEnded: {
          const endedMsg = messageData as IWSGameEndedMessage;
          const { winner, statusText } = processGameEndedMessage(
            endedMsg,
            playerColor
          );
          setGameState((prev) => ({
            ...prev,
            winner,
            gameStatus: statusText,
            isEnded: true,
          }));
          break;
        }

        case WebSocketMessageTypeEnum.Joined: {
          const joinedMsg = messageData as IWSJoinedMessage;

          if (joinedMsg.gameId === gameId) {
            if (gameDetails) {
              const updatedGameDetails = {
                ...gameDetails,
                fen: joinedMsg.fen || gameDetails.fen,
                duration: joinedMsg.duration || gameDetails.duration,
                playerColor: gameDetails.playerColor,
              };
              localStorageHelper.setItem(
                LocalStorageKeysEnum.GameDetails,
                updatedGameDetails
              );
            }

            setGameState((prev) => ({
              ...prev,
              gameStatus:
                stablePlayerColor === "w"
                  ? "Your turn to move"
                  : "Waiting for white to move",
            }));

            if (joinedMsg.fen) {
              game.load(joinedMsg.fen);
              const initialCapturedPieces = calculateCapturedPieces(
                game.board()
              );
              setGameState((prev) => ({
                ...prev,
                fen: game.fen(),
                playerTurn: game.turn() as Color,
                moveHistory: game.history(),
                capturedPieces: initialCapturedPieces,
                gameStatus:
                  game.turn() === stablePlayerColor
                    ? "Your turn to move"
                    : `Waiting for ${
                        game.turn() === "w" ? "white" : "black"
                      } to move`,
              }));
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

            setGameState((prev) => ({
              ...prev,
              fen: game.fen(),
              playerTurn: game.turn() as Color,
              moveHistory: game.history(),
              capturedPieces: newCapturedPieces,
              isOpponentConnected: true,
              isTimerRunning: reconnectedMsg.status === "active",
              gameStatus: game.isGameOver()
                ? `Game ${reconnectedMsg.status}`
                : game.turn() === stablePlayerColor
                ? "Your turn to move"
                : `Waiting for ${
                    game.turn() === "w" ? "white" : "black"
                  } to move`,
            }));

            // Update localStorage with reconnected game details if needed
            const currentGameDetails = localStorageHelper.getItem(
              LocalStorageKeysEnum.GameDetails
            ) as IGameDetailsLocalStorage;

            if (currentGameDetails) {
              localStorageHelper.setItem(LocalStorageKeysEnum.GameDetails, {
                ...currentGameDetails,
                fen: reconnectedMsg.fen,
              });
            }
          }
          break;
        }

        case WebSocketMessageTypeEnum.Error: {
          const errorMsg = messageData as IWSErrorMessage;
          toast.error(`Game Error: ${errorMsg.message}`);
          break;
        }
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message:", err);
    }
  }, [lastMessage, game, gameId, playerColor]);

  // Handle square click updates
  const handleSquareClick = useCallback(
    (square: Square) => {
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
          setGameState((prev) => ({
            ...prev,
            selectedSquare: square,
            validMoves: legalMoves.map((m) => m.to as Square),
          }));
        } else if (piece) {
          // If player selected opponent's piece
          toast.error("You can only move your own pieces!");
        }
      } else {
        if (gameState.validMoves.includes(square)) {
          try {
            const initialFen = game.fen();
            const move = game.move({
              from: gameState.selectedSquare,
              to: square,
              promotion: "q", // Always promote to queen for simplicity
            });

            if (move && gameId) {
              // Create move data with explicit from/to for the highlight
              const lastMove = {
                from: move.from as Square,
                to: move.to as Square,
              };

              const moveMessage: IWSMoveMessage = {
                type: WebSocketMessageTypeEnum.Move,
                gameId,
                fen: game.fen(),
                initialFen,
                walletAddress: walletAddress!,
                move: `${move.from}${move.to}`,
              };

              // Send move message to the server
              sendMessage(JSON.stringify(moveMessage));

              // Update local state with the move highlight
              setGameState((prev) => ({
                ...prev,
                fen: game.fen(),
                playerTurn: game.turn() as Color,
                moveHistory: game.history(),
                lastMove: lastMove,
                moveHighlight: lastMove,
                selectedSquare: null,
                validMoves: [],
                gameStatus: `Waiting for ${
                  game.turn() === "w" ? "white" : "black"
                } to move`,
              }));

              // Clear any previous timeout and set a new one
              if (moveHighlightTimeoutRef.current) {
                clearTimeout(moveHighlightTimeoutRef.current);
              }

              // Set a longer timeout (3 seconds)
              moveHighlightTimeoutRef.current = setTimeout(() => {
                setGameState((prev) => ({
                  ...prev,
                  moveHighlight: null,
                }));
              }, 3000);
            }
          } catch (error) {
            console.error("Move error:", error);
            toast.error("Invalid move!");
          }
        }

        // Always clear selection after an attempt to move, whether valid or not
        setGameState((prev) => ({
          ...prev,
          selectedSquare: null,
          validMoves: [],
        }));
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
    ]
  );

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
            const isValidMove = gameState.validMoves.includes(square);
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

  // Render player panel
  const PlayerPanel = ({ color }: { color: Color }) => {
    // Use the stable orientation for player identity as well
    const isPlayer = stablePlayerColor === color;
    const player = {
      name: isPlayer ? "You" : "Opponent",
    };
    const isCurrentTurn = gameState.playerTurn === color;
    const timeRemaining =
      color === "w"
        ? gameState.whitePlayerTimerInMilliseconds
        : gameState.blackPlayerTimerInMilliseconds;
    const capturedPieces = gameState.capturedPieces[color];

    // Use the stable orientation for panel positioning
    const shouldBeTop =
      stablePlayerColor === "w" ? color === "b" : color === "w";

    return (
      <div
        className={`
          bg-gray-900/60 backdrop-blur-sm rounded-xl p-3 sm:p-4
          border ${
            isCurrentTurn ? "border-amber-500/50" : "border-amber-900/20"
          } shadow-lg
          ${shouldBeTop ? "mb-4 sm:mb-8" : "mt-4 sm:mt-8"}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Avatar
              className={
                isPlayer
                  ? "ring-2 ring-amber-500 w-8 h-8 sm:w-10 sm:h-10"
                  : "w-8 h-8 sm:w-10 sm:h-10"
              }
            >
              <AvatarFallback
                className={
                  isPlayer
                    ? "bg-amber-700 text-sm sm:text-base"
                    : "bg-gray-700 text-sm sm:text-base"
                }
              >
                {player.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-white flex items-center flex-wrap gap-1 sm:gap-2 text-sm sm:text-base">
                {player.name}
                {isPlayer && (
                  <span className="text-xs bg-amber-600/30 border border-amber-600/50 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                    You
                  </span>
                )}
                {isCurrentTurn && (
                  <span className="text-xs bg-green-600/30 border border-green-600/50 px-1 py-0.5 sm:px-2 sm:py-0.5 rounded-full">
                    {isPlayer ? "Your Turn" : "Turn"}
                  </span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400">
                {color === "w" ? "White" : "Black"}
              </p>
            </div>
          </div>
          <div
            className={`text-lg sm:text-2xl font-mono font-bold ${
              timeRemaining <= 30 ? "text-red-500" : "text-white"
            }`}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Captured Pieces - made more responsive */}
        {capturedPieces.length > 0 && (
          <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
            {capturedPieces.map((piece, index) => (
              <motion.div
                key={`${piece.type}-${index}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.8 }}
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <img
                  src={`https://www.chess.com/chess-themes/pieces/neo/150/${piece.color}${piece.type}.png`}
                  alt={`${piece.color}${piece.type}`}
                  className="w-full h-full object-contain opacity-75"
                />
              </motion.div>
            ))}
          </div>
        )}

        {isCurrentTurn && (
          <div className="mt-2 h-1 w-full bg-amber-500/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 animate-pulse"
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    );
  };

  const [showResignDialog, setShowResignDialog] = useState(false);
  const resignSentRef = useRef(false);

  // --- Resign logic ---
  const handleResign = useCallback(() => {
    if (!gameId || !walletAddress || gameState.isEnded || resignSentRef.current)
      return;
    resignSentRef.current = true;
    const resignMsg = {
      type: WebSocketMessageTypeEnum.Resign,
      gameId,
      walletAddress,
    };
    sendMessage(JSON.stringify(resignMsg));
    setGameState((prev) => ({
      ...prev,
      isEnded: true,
      winner: stablePlayerColor === "w" ? "b" : "w", // Opponent wins
      gameStatus: "You resigned. Game ended.",
    }));
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
      setGameState((prev) => {
        if (prev.isEnded) return prev;
        // Only decrement the timer for the player whose turn it is
        let w = prev.whitePlayerTimerInMilliseconds;
        let b = prev.blackPlayerTimerInMilliseconds;
        if (prev.playerTurn === "w") {
          w = Math.max(0, w - 1000);
        } else if (prev.playerTurn === "b") {
          b = Math.max(0, b - 1000);
        }
        // If timer hits zero and it's our turn, auto-resign
        if (
          prev.playerTurn === stablePlayerColor &&
          ((prev.playerTurn === "w" && w <= 0) ||
            (prev.playerTurn === "b" && b <= 0)) &&
          !resignSentRef.current &&
          !prev.isEnded
        ) {
          handleResign();
        }
        // Update localStorage here as well
        localStorageHelper.updateItem(LocalStorageKeysEnum.GameState, {
          ...prev,
          whitePlayerTimerInMilliseconds: w,
          blackPlayerTimerInMilliseconds: b,
        });
        return {
          ...prev,
          whitePlayerTimerInMilliseconds: w,
          blackPlayerTimerInMilliseconds: b,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.playerTurn, gameState.isEnded, handleResign, stablePlayerColor]);

  useEffect(() => {
    if (savedGameState && savedGameState.fen) {
      game.load(savedGameState.fen);
    }
  }, []);

  // --- Update timer every second ---
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        ...(gameState.playerTurn === "w"
          ? {
              whitePlayerTimerInMilliseconds: Math.max(
                0,
                prev.whitePlayerTimerInMilliseconds - 1000
              ),
            }
          : {
              blackPlayerTimerInMilliseconds: Math.max(
                0,
                prev.blackPlayerTimerInMilliseconds - 1000
              ),
            }),
      }));

      // update local storage
      localStorageHelper.updateItem(LocalStorageKeysEnum.GameState, {
        ...gameState,
        ...(gameState.playerTurn === "w"
          ? {
              whitePlayerTimerInMilliseconds: Math.max(
                0,
                gameState.whitePlayerTimerInMilliseconds - 1000
              ),
            }
          : {
              blackPlayerTimerInMilliseconds: Math.max(
                0,
                gameState.blackPlayerTimerInMilliseconds - 1000
              ),
            }),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.playerTurn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white">
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
            className="text-gray-300 hover:text-black self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Lobby
          </Button>

          <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-auto">
            <Button
              variant="outline"
              className="gap-1 sm:gap-2 text-black cursor-pointer text-xs sm:text-sm"
              size="sm"
            >
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <AlertDialog
              open={showResignDialog}
              onOpenChange={setShowResignDialog}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="gap-1 sm:gap-2 cursor-pointer text-xs sm:text-sm"
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
                    Are you sure you want to resign? This will end the game and
                    your opponent will be declared the winner.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowResignDialog(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleResign} autoFocus>
                    Yes, Resign
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
