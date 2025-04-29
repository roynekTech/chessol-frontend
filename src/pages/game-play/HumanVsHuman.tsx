import { useState, useEffect, useCallback } from "react";
import { Chess, Square, Color, PieceSymbol } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { ChessBoard } from "../../components/game/ChessBoard";
import { PlayerPanel } from "../../components/game/PlayerPanel";
import { GameInfo } from "../../components/game/GameInfo";
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
} from "../../utils/type";
import { helperUtil } from "../../utils/helper";

// Types
interface ICapturedPieceData {
  w: { type: PieceSymbol; color: Color }[];
  b: { type: PieceSymbol; color: Color }[];
}

interface IGameState {
  fen: string;
  playerTurn: Color;
  moveHistory: string[];
  capturedPieces: ICapturedPieceData;
  selectedSquare: Square | null;
  validMoves: Square[];
  moveTrail: { from: Square; to: Square } | null;
  winner: Color | "draw" | null;
  gameStatus: string;
  timers: { w: number; b: number };
  activeTimer: Color | null;
}

// Custom Hooks
const useGameState = (initialFen: string = "start") => {
  const game = new Chess(initialFen === "start" ? undefined : initialFen);
  const [state, setState] = useState<IGameState>({
    fen: game.fen(),
    playerTurn: game.turn() as Color,
    moveHistory: game.history({ verbose: false }),
    capturedPieces: { w: [], b: [] },
    selectedSquare: null,
    validMoves: [],
    moveTrail: null,
    winner: null,
    gameStatus:
      initialFen === "start" ? "Waiting for opponent..." : "Game in progress",
    timers: { w: 600, b: 600 },
    activeTimer: null,
  });

  const updateState = useCallback(
    (updates: Partial<IGameState> | ((prev: IGameState) => IGameState)) => {
      if (typeof updates === "function") {
        setState(updates);
      } else {
        setState((prev) => ({ ...prev, ...updates }));
      }
    },
    []
  );

  return { game, state, updateState };
};

const useGameWebSocket = (
  game: Chess,
  gameId: string | null,
  playerColor: Color | null,
  updateGameState: (
    updates: Partial<IGameState> | ((prev: IGameState) => IGameState)
  ) => void,
  navigate: (path: string) => void
) => {
  const { sendMessage, lastMessage } = useWebSocketContext();
  const [isOpponentConnected, setIsOpponentConnected] = useState(false);

  useEffect(() => {
    if (!lastMessage?.data) return;

    try {
      const messageData = JSON.parse(lastMessage.data);
      console.log("messageData from game page", messageData);
      if (
        !messageData?.type ||
        (messageData.gameId && messageData.gameId !== gameId)
      ) {
        return;
      }

      switch (messageData.type) {
        // Handle move messages
        case WebSocketMessageTypeEnum.Move: {
          const moveMsg = messageData as IWSMoveBroadcast;
          if (moveMsg.fen) {
            game.load(moveMsg.fen);
            updateGameState({
              fen: game.fen(),
              playerTurn: game.turn() as Color,
              moveHistory: game.history({ verbose: false }),
              capturedPieces: calculateCapturedPieces(game.board()),
              moveTrail: moveMsg.lastMove as { from: Square; to: Square },
              selectedSquare: null,
              validMoves: [],
            });

            // Update localStorage
            if (gameId && playerColor) {
              localStorageHelper.updateItem(LocalStorageKeysEnum.GameDetails, {
                gameId,
                playerColor,
                fen: game.fen(),
                isJoined: true,
              });
            }
          }
          break;
        }

        // Handle game ended messages
        case WebSocketMessageTypeEnum.GameEnded: {
          const endedMsg = messageData as IWSGameEndedMessage;
          const { winner, statusText } = processGameEndedMessage(endedMsg);
          updateGameState({
            winner,
            gameStatus: statusText,
            activeTimer: null,
          });
          break;
        }

        case WebSocketMessageTypeEnum.Error: {
          const errorMsg = messageData as IWSErrorMessage;
          toast.error(`Server Error: ${errorMsg.message}`);
          if (
            errorMsg.message?.toLowerCase().includes("reconnect") ||
            errorMsg.message?.toLowerCase().includes("game no longer exists")
          ) {
            localStorageHelper.deleteItem(LocalStorageKeysEnum.GameDetails);
            navigate("/");
          }
          break;
        }

        case WebSocketMessageTypeEnum.Joined:
        case WebSocketMessageTypeEnum.Created:
        case WebSocketMessageTypeEnum.Reconnected: {
          if (messageData.fen) {
            try {
              game.load(messageData.fen);
              updateGameState({
                fen: game.fen(),
                playerTurn: game.turn() as Color,
                moveHistory: game.history({ verbose: false }),
                capturedPieces: calculateCapturedPieces(game.board()),
                gameStatus:
                  game.turn() === playerColor ? "Your turn" : "Opponent's turn",
              });

              if (gameId && playerColor) {
                localStorageHelper.updateItem(
                  LocalStorageKeysEnum.GameDetails,
                  {
                    gameId,
                    playerColor,
                    fen: game.fen(),
                    isJoined: true,
                  }
                );
              }
            } catch {
              toast.error("Invalid FEN received from server. Redirecting...");
              localStorageHelper.deleteItem(LocalStorageKeysEnum.GameDetails);
              navigate("/");
              break;
            }
          }
          setIsOpponentConnected(true);
          if (!messageData.fen) {
            updateGameState({
              gameStatus:
                game.turn() === playerColor ? "Your turn" : "Opponent's turn",
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
      toast.error("Received invalid data from server.");
    }
  }, [lastMessage, gameId, navigate]);

  return { isOpponentConnected, sendMessage };
};

// Utility Functions
const calculateCapturedPieces = (
  board: ReturnType<Chess["board"]>
): ICapturedPieceData => {
  const startingCounts = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
  };

  const currentCounts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  for (const row of board) {
    for (const piece of row) {
      if (piece) {
        currentCounts[piece.color][piece.type]++;
      }
    }
  }

  const captured: ICapturedPieceData = { w: [], b: [] };
  (["w", "b"] as Color[]).forEach((color) => {
    (["p", "n", "b", "r", "q"] as PieceSymbol[]).forEach((type) => {
      const diff = startingCounts[color][type] - currentCounts[color][type];
      for (let i = 0; i < diff; i++) {
        captured[color === "w" ? "b" : "w"].push({ type, color });
      }
    });
  });

  return captured;
};

const processGameEndedMessage = (
  endedMsg: IWSGameEndedMessage
): { winner: Color | "draw" | null; statusText: string } => {
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
    winner = endedMsg.winner as Color | "draw" | null;
    statusText = `Game ended. ${endedMsg.winner} wins. Reason: ${endedMsg.reason}`;
  }

  return { winner, statusText };
};

// Main Component
export function HumanVsHuman() {
  const navigate = useNavigate();
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  // Load game details from localStorage
  const gameDetails = localStorageHelper.getItem(
    LocalStorageKeysEnum.GameDetails
  ) as IGameDetailsLocalStorage | null;

  const gameId = gameDetails?.gameId || null;
  const playerColor = (gameDetails?.playerColor || null) as Color | null;
  const initialFen = gameDetails?.fen || "start";

  // Initialize game state
  const { game, state, updateState } = useGameState(initialFen);

  // Initialize WebSocket handling
  const { isOpponentConnected, sendMessage } = useGameWebSocket(
    game,
    gameId,
    playerColor,
    updateState,
    navigate
  );

  // Handle reconnection on page load/return
  useEffect(() => {
    if (!walletAddress) {
      toast.info("Please connect your wallet to join game");
      return;
    }

    // Only attempt reconnection if we have existing game details
    if (gameDetails?.isJoined && gameId && walletAddress) {
      console.log("Attempting to reconnect to game...");

      // Small delay to ensure WebSocket connection is established
      const reconnectTimer = setTimeout(() => {
        sendMessage(
          JSON.stringify({
            type: WebSocketMessageTypeEnum.Reconnect,
            gameId: gameId,
            playerId: walletAddress,
          })
        );
      }, 1000);

      return () => clearTimeout(reconnectTimer);
    } else if (!gameDetails?.gameId || !gameDetails?.playerColor) {
      // If no valid game details, redirect to games page
      navigate("/games");
    }
  }, [gameDetails, gameId, walletAddress, navigate]);

  // Handle square click for moves
  const handleSquareClick = useCallback(
    (square: Square) => {
      if (
        !gameId ||
        !playerColor ||
        state.winner ||
        game.isGameOver() ||
        state.playerTurn !== playerColor
      ) {
        if (state.playerTurn !== playerColor)
          toast.error("It's not your turn!");
        return;
      }

      if (!state.selectedSquare) {
        const piece = game.get(square);
        if (piece?.color === playerColor) {
          const legalMoves = game.moves({ square, verbose: true });
          updateState({
            selectedSquare: square,
            validMoves: legalMoves.map((m) => m.to),
          });
        }
      } else {
        try {
          if (state.validMoves.includes(square)) {
            const moveAttempt = {
              from: state.selectedSquare,
              to: square,
              promotion: "q" as PieceSymbol, // Default to queen promotion
            };

            const initialFen = game.fen();
            const moveResult = game.move(moveAttempt);

            if (moveResult && walletAddress) {
              updateState({
                fen: game.fen(),
                playerTurn: game.turn(),
                moveHistory: game.history({ verbose: false }),
                capturedPieces: calculateCapturedPieces(game.board()),
                moveTrail: { from: moveResult.from, to: moveResult.to },
                selectedSquare: null,
                validMoves: [],
              });

              const wsMoveMessage: IWSMoveMessage = {
                type: WebSocketMessageTypeEnum.Move,
                gameId,
                fen: game.fen(),
                initialFen,
                walletAddress,
                move: `${moveAttempt.from}${moveAttempt.to}`,
              };
              sendMessage(JSON.stringify(wsMoveMessage));
            }
          }
          updateState({ selectedSquare: null, validMoves: [] });
        } catch (error) {
          console.error("Move error:", error);
          updateState({ selectedSquare: null, validMoves: [] });
        }
      }
    },
    [game, gameId, playerColor, state, walletAddress, sendMessage, updateState]
  );

  // Handle resignation
  const handleResign = useCallback(() => {
    if (!gameId || !playerColor || state.winner || game.isGameOver()) return;
    sendMessage(
      JSON.stringify({
        type: WebSocketMessageTypeEnum.Resign,
        gameId,
      })
    );
  }, [gameId, playerColor, state.winner, game, sendMessage]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (
      state.activeTimer &&
      !game.isGameOver() &&
      !state.winner &&
      isOpponentConnected
    ) {
      interval = setInterval(() => {
        updateState(
          (prev: IGameState): IGameState => ({
            ...prev,
            timers: {
              ...prev.timers,
              [state.activeTimer!]: Math.max(
                0,
                prev.timers[state.activeTimer!] - 1
              ),
            },
            ...(prev.timers[state.activeTimer!] <= 1
              ? {
                  winner:
                    state.activeTimer === "w" ? ("b" as const) : ("w" as const),
                  gameStatus: `${
                    state.activeTimer === "w" ? "Black" : "White"
                  } wins on time`,
                  activeTimer: null,
                }
              : {}),
          })
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.activeTimer, game, state.winner, isOpponentConnected, updateState]);

  // Determine player names
  const whitePlayerName = playerColor === "w" ? "You" : "Opponent";
  const blackPlayerName = playerColor === "b" ? "You" : "Opponent";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-950 to-black text-white flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-6xl mx-auto mb-4 flex flex-row justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-gray-300 hover:text-black cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lobby
        </Button>
        <GameInfo
          gameMode="human"
          opponentName="Opponent"
          gameId={gameId || ""}
        />
        {!state.winner && !game.isGameOver() && isOpponentConnected && (
          <Button
            variant="destructive"
            onClick={handleResign}
            size="sm"
            className="ml-4 bg-red-700/80 hover:bg-red-600"
          >
            Resign
          </Button>
        )}
      </div>

      {/* Status Display */}
      <div className="w-full max-w-xl mx-auto mb-4 text-center">
        <div
          className={`px-4 py-1 rounded-full inline-block ${
            state.winner || game.isGameOver()
              ? state.winner === playerColor ||
                (state.winner !== "draw" &&
                  state.winner !== (playerColor === "w" ? "b" : "w"))
                ? "bg-green-600/80"
                : state.winner === "draw"
                ? "bg-gray-600/80"
                : "bg-red-700/80"
              : state.gameStatus.includes("check")
              ? "bg-yellow-600/80"
              : "bg-gray-800/80"
          }`}
        >
          {state.gameStatus}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="container max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
        {/* Black Player Panel */}
        <PlayerPanel
          playerColor="b"
          playerName={blackPlayerName}
          isCurrentPlayer={state.playerTurn === "b"}
          timerValue={state.timers.b}
          capturedPieces={state.capturedPieces.b}
          moveHistory={state.moveHistory}
          getPieceImageUrl={helperUtil.getPieceImageUrl}
          formatTime={helperUtil.formatTime}
          isPlayer={playerColor === "b"}
          showRestartButton={false}
          isConnected={playerColor === "b" ? true : isOpponentConnected}
        />

        {/* Chess Board */}
        <div className="lg:order-0 -order-3 mb-6 lg:mb-0">
          <div className="aspect-square mx-auto relative max-w-xl">
            <AnimatePresence>
              {(state.winner || game.isGameOver()) && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 rounded-lg p-4"
                >
                  <div className="text-center">
                    <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-yellow-400 mb-3 sm:mb-4" />
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">
                      {state.gameStatus}
                    </h2>
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 cursor-pointer"
                      onClick={() => navigate("/")}
                    >
                      Back to Lobby
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ChessBoard
              board={game.board()}
              turn={state.playerTurn}
              selectedSquare={state.selectedSquare}
              validMoves={state.validMoves}
              handleSquareClick={handleSquareClick}
              lastMove={game.history({ verbose: true }).slice(-1)[0] || null}
              moveTrail={state.moveTrail}
              boardOrientation={playerColor ?? ("w" as Color)}
            />

            <div className="mt-4 text-xs text-gray-400 text-center break-all">
              <span className="font-mono bg-black/40 p-1 rounded select-all">
                {state.fen}
              </span>
            </div>
          </div>
        </div>

        {/* White Player Panel */}
        <PlayerPanel
          playerColor="w"
          playerName={whitePlayerName}
          isCurrentPlayer={state.playerTurn === "w"}
          timerValue={state.timers.w}
          capturedPieces={state.capturedPieces.w}
          moveHistory={state.moveHistory}
          getPieceImageUrl={helperUtil.getPieceImageUrl}
          formatTime={helperUtil.formatTime}
          isPlayer={playerColor === "w"}
          showRestartButton={false}
          isConnected={playerColor === "w" ? true : isOpponentConnected}
        />
      </div>
    </div>
  );
}

export default HumanVsHuman;
