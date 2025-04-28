import { useState, useEffect, useCallback } from "react";
import { Chess, Square, Color, PieceSymbol } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// --- Project Imports ---
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
import { useWallet } from "@solana/wallet-adapter-react";

// Define the structure for captured pieces
interface ICapturedPieceData {
  w: { type: PieceSymbol; color: Color }[];
  b: { type: PieceSymbol; color: Color }[];
}

// --- HumanVsHuman Component ---
export function HumanVsHuman() {
  // --- Routing and URL Params ---
  const navigate = useNavigate();

  // --- WebSocket ---
  const { sendMessage, lastMessage } = useWebSocketContext();

  // --- Game and Player Details (from localStorage) ---
  // Always load from localStorage on mount for reconnection
  const [gameDetails, setGameDetails] =
    useState<IGameDetailsLocalStorage | null>(() => {
      return localStorageHelper.getItem(
        LocalStorageKeysEnum.GameDetails
      ) as IGameDetailsLocalStorage | null;
    });
  const gameId = gameDetails?.gameId || null;
  const playerColor = gameDetails?.playerColor || null; // 'w' or 'b'
  const initialFen = gameDetails?.fen || "start"; // Use initial FEN from storage

  // --- Core Game State ---
  // Initialize Chess instance with FEN from storage or default
  const [game] = useState(
    new Chess(initialFen === "start" ? undefined : initialFen)
  );
  const [fen, setFen] = useState(game.fen());
  // Use playerTurn as the single source of truth for whose turn it is
  const [playerTurn, setPlayerTurn] = useState<Color>(game.turn() || "w"); // Default to white if not set
  const [gameStatus, setGameStatus] = useState("Waiting for opponent...");
  const [moveHistory, setMoveHistory] = useState<string[]>(
    game.history({ verbose: false })
  );
  const [capturedPieces, setCapturedPieces] = useState<ICapturedPieceData>({
    w: [],
    b: [],
  }); // TODO: Populate captured pieces based on initial FEN difference?

  // --- Board Interaction State ---
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [moveTrail, setMoveTrail] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // --- Timer State ---
  // TODO: Get initial timer values from WebSocket/GameDetails
  const [timers, setTimers] = useState({ w: 600, b: 600 });
  const [activeTimer, setActiveTimer] = useState<Color | null>(null); // Start paused until game confirmed active

  // --- Opponent/Connection State ---
  const [isOpponentConnected, setIsOpponentConnected] = useState(false); // Track opponent status
  // TODO: Get opponent name from WebSocket
  const opponentName = "Opponent";
  const [winner, setWinner] = useState<Color | "draw" | null>(null); // Store winner for game over state

  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  // Update game status based on chess.js state
  const updateGameStatus = useCallback(
    (isGameOver = false, endReason = "") => {
      if (winner) return; // Don't update status if already ended by WS message

      const turn = game.turn();
      setFen(game.fen());
      setPlayerTurn(turn);
      setMoveHistory(game.history({ verbose: false }));

      if (isGameOver || game.isGameOver()) {
        setActiveTimer(null);
        let statusText = "Game Over";
        if (endReason) {
          statusText = endReason; // Use reason from WS if available
        } else if (game.isCheckmate()) {
          statusText = `Checkmate! ${turn === "w" ? "Black" : "White"} wins`;
          setWinner(turn === "w" ? "b" : "w");
        } else if (game.isDraw()) {
          statusText = "Draw!";
          setWinner("draw");
        } else if (game.isStalemate()) {
          statusText = "Stalemate!";
          setWinner("draw");
        } else if (game.isInsufficientMaterial()) {
          statusText = "Draw due to insufficient material!";
          setWinner("draw");
        } else if (game.isThreefoldRepetition()) {
          statusText = "Draw due to threefold repetition!";
          setWinner("draw");
        }
        setGameStatus(statusText);
      } else if (game.isCheck()) {
        setGameStatus(`${turn === "w" ? "White" : "Black"} is in check!`);
        setActiveTimer(turn); // Timer runs for the player in check
      } else {
        // --- Modern UX: Always allow your move, regardless of opponent connection ---
        if (playerTurn === playerColor) {
          setGameStatus("Your move");
          setActiveTimer(turn);
        } else if (!isOpponentConnected) {
          setGameStatus("Waiting for opponent to reply...");
          setActiveTimer(turn);
        } else {
          setGameStatus("Opponent's move");
          setActiveTimer(turn);
        }
      }
    },
    [game, winner, playerColor, isOpponentConnected]
  );

  // try to reconnect to the game when page loads and user was in the game already
  useEffect(() => {
    // Always load latest game details from localStorage
    const storedDetails = localStorageHelper.getItem(
      LocalStorageKeysEnum.GameDetails
    ) as IGameDetailsLocalStorage | null;

    if (!storedDetails?.gameId || !storedDetails?.playerColor) {
      // toast.error("Missing game details. Redirecting...");
      console.error("Missing gameId or playerColor", storedDetails);
      navigate("/games");
      return;
    }

    if (storedDetails?.isJoined) {
      // sleep for 1 second before reconnecting
      (async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log("Reconnecting to game...");
        sendMessage(
          JSON.stringify({
            type: WebSocketMessageTypeEnum.Reconnect,
            gameId: storedDetails.gameId,
            playerId: walletAddress,
          })
        );
      })();
    }

    updateGameStatus();
    console.log("Game initialized - storedDetails", storedDetails);
  }, [navigate]); // Only run on mount

  // Websocket handlers
  useEffect(() => {
    if (!lastMessage?.data) return;

    let messageData;
    try {
      messageData = JSON.parse(lastMessage.data);
      if (!messageData || !messageData.type) return; // Ignore invalid messages
      console.log("Received WS Message:", messageData);

      // Ignore messages not related to this game
      if (messageData.gameId && messageData.gameId !== gameId) {
        return;
      }

      switch (messageData.type) {
        case WebSocketMessageTypeEnum.Move: {
          const moveMsg = messageData as IWSMoveBroadcast;
          // --- Always trust the server's FEN for board state sync ---
          if (moveMsg.fen) {
            game.load(moveMsg.fen); // Sync board to server FEN
            setFen(game.fen());
            setPlayerTurn(game.turn());
            setMoveHistory(game.history({ verbose: false }));
            setCapturedPieces(calculateCapturedPieces(game.board()));
            // --- Persist latest game details to localStorage ---
            localStorageHelper.setItem(LocalStorageKeysEnum.GameDetails, {
              gameId: gameId!,
              playerColor: playerColor!,
              fen: game.fen(),
              isBetting: gameDetails?.isBetting || false,
              isJoined: true,
            });
          }
          setMoveTrail(moveMsg.lastMove as { from: Square; to: Square });
          updateGameStatus();
          setSelectedSquare(null);
          setValidMoves([]);
          break;
        }
        case WebSocketMessageTypeEnum.GameEnded: {
          const endedMsg = messageData as IWSGameEndedMessage;
          let statusText = "Game Over!";
          let winningColor: Color | "draw" | null = null;

          if (endedMsg.reason === "checkmate") {
            winningColor = endedMsg.winner === "w" ? "w" : "b";
            statusText = `Checkmate! ${
              winningColor === "w" ? "White" : "Black"
            } wins`;
          } else if (endedMsg.reason === "resignation") {
            winningColor = endedMsg.winner === "w" ? "w" : "b";
            statusText = `${
              winningColor === "w" ? "White" : "Black"
            } wins by resignation`;
          } else if (endedMsg.reason === "timeout") {
            winningColor = endedMsg.winner === "w" ? "w" : "b";
            statusText = `${
              winningColor === "w" ? "White" : "Black"
            } wins on time`;
          } else if (
            endedMsg.reason === "draw" ||
            endedMsg.reason === "stalemate" ||
            endedMsg.reason === "insufficient_material" ||
            endedMsg.reason === "threefold_repetition"
          ) {
            statusText = `Draw by ${endedMsg.reason.replace("_", " ")}!`;
            winningColor = "draw";
          } else {
            // Handle other potential reasons or default
            winningColor = endedMsg.winner as Color | "draw" | null; // Trust the winner field
            statusText = `Game ended. ${endedMsg.winner} wins. Reason: ${endedMsg.reason}`;
          }

          setWinner(winningColor);
          updateGameStatus(true, statusText); // Force game over state with WS reason
          break;
        }
        case WebSocketMessageTypeEnum.Error: {
          const errorMsg = messageData as IWSErrorMessage;
          console.error("Received WebSocket Error:", errorMsg.message);
          toast.error(`Server Error: ${errorMsg.message}`);
          // --- If error is due to reconnect failure, clear localStorage and redirect ---
          if (
            errorMsg.message?.toLowerCase().includes("reconnect") ||
            errorMsg.message?.toLowerCase().includes("game no longer exists") ||
            errorMsg.message?.toLowerCase().includes("not found")
          ) {
            localStorageHelper.deleteItem(LocalStorageKeysEnum.GameDetails);
            navigate("/");
          }
          break;
        }
        case WebSocketMessageTypeEnum.Joined:
        case WebSocketMessageTypeEnum.Created:
        case WebSocketMessageTypeEnum.Reconnected: {
          console.log("lastMessage", lastMessage);
          // --- On join/rejoin, always use the server's FEN ---
          if (messageData.fen) {
            try {
              game.load(messageData.fen); // Sync board to server FEN
            } catch {
              toast.error("Invalid FEN received from server. Redirecting...");
              localStorageHelper.deleteItem(LocalStorageKeysEnum.GameDetails);
              navigate("/");
              break;
            }
            // --- Always update all state after loading FEN ---
            const newFen = game.fen();
            const newTurn = game.turn();
            setFen(newFen);
            setPlayerTurn(newTurn);
            setMoveHistory(game.history({ verbose: false }));
            setCapturedPieces(calculateCapturedPieces(game.board()));
            // --- Persist latest game details to localStorage ---
            localStorageHelper.setItem(LocalStorageKeysEnum.GameDetails, {
              gameId: messageData.gameId || gameId!,
              playerColor: messageData.color || playerColor!,
              fen: newFen,
              isBetting: gameDetails?.isBetting || false,
              isJoined: true,
            });
            setGameDetails({
              gameId: messageData.gameId || gameId!,
              playerColor: messageData.color || playerColor!,
              fen: newFen,
              isBetting: gameDetails?.isBetting || false,
              isJoined: true,
            });
          }
          setIsOpponentConnected(true);
          // --- Always update game status after state updates ---
          updateGameStatus();
          toast.info("Opponent connected.");
          break;
        }
        // Add cases for other message types like CHAT, OFFER_DRAW, etc. later

        default:
          // Ignore unknown message types
          break;
      }
    } catch (error) {
      console.error(
        "Error parsing WebSocket message:",
        error,
        lastMessage.data
      );
      toast.error("Received invalid data from server.");
    }
  }, [lastMessage]);

  // Effect: Update the timer every second
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimer && !game.isGameOver() && !winner && isOpponentConnected) {
      // Only run if opponent connected
      interval = setInterval(() => {
        setTimers((prev) => {
          const newTime = Math.max(0, prev[activeTimer] - 1);
          if (newTime === 0) {
            // Time ran out - client-side detection
            // The server should ideally send a GAME_ENDED message too
            if (interval) clearInterval(interval);
            const timeoutWinner = activeTimer === "w" ? "b" : "w";
            setWinner(timeoutWinner);
            updateGameStatus(
              true,
              `${timeoutWinner === "w" ? "White" : "Black"} wins on time`
            );
            setActiveTimer(null);
          }
          return { ...prev, [activeTimer]: newTime };
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval); // Clear if timer should be inactive
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // Add isOpponentConnected to dependencies
  }, [activeTimer, game, winner, isOpponentConnected, updateGameStatus]);

  // --- Effect: Handle move trail animation timing ---
  useEffect(() => {
    if (moveTrail) {
      const timer = setTimeout(() => setMoveTrail(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [moveTrail]);

  // --- Game Logic Functions ---

  // --- Handle Player's Click on a Square ---
  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!gameId || !playerColor) return; // Safety check
      if (winner || game.isGameOver()) return; // Game already over
      if (playerTurn !== playerColor) {
        // Not player's turn
        toast.error("It's not your turn!");
        return;
      }

      if (!selectedSquare) {
        // --- Selecting a piece ---
        const piece = game.get(square);
        if (piece && piece.color === playerColor) {
          // Can only select own pieces
          setSelectedSquare(square);
          const legalMoves = game.moves({ square, verbose: true });
          setValidMoves(legalMoves.map((m) => m.to));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      } else {
        // --- Making a move ---
        try {
          // Check if the target square is a valid move for the selected piece
          const isMoveValid = validMoves.includes(square);

          if (isMoveValid) {
            const piece = game.get(selectedSquare);
            // Determine if this is a pawn promotion (pawn moving to last rank)
            const isPawnPromotion =
              piece &&
              piece.type === "p" &&
              ((piece.color === "w" && square[1] === "8") ||
                (piece.color === "b" && square[1] === "1"));

            // Build moveAttempt object according to API
            const moveAttempt: {
              from: Square;
              to: Square;
              promotion?: PieceSymbol;
            } = {
              from: selectedSquare,
              to: square,
            };
            if (isPawnPromotion) {
              moveAttempt.promotion = "q"; // Default to queen promotion
            }

            // --- Store FEN before move for server verification ---
            const initialFen = game.fen(); // FEN before move

            // --- Make move locally FIRST for responsiveness ---
            const moveResult = game.move(moveAttempt);

            if (moveResult) {
              // --- Update local state immediately ---
              setCapturedPieces(calculateCapturedPieces(game.board()));
              const currentFen = game.fen(); // Get FEN *after* the move
              setMoveTrail({ from: moveResult.from, to: moveResult.to });
              updateGameStatus();

              // --- API-compliant move message ---
              // See docs/api.md: 'Make Move' section
              if (!walletAddress) {
                toast.error("Wallet not connected. Cannot send move.");
                setSelectedSquare(null);
                setValidMoves([]);
                return;
              }
              const wsMoveMessage: IWSMoveMessage = {
                type: WebSocketMessageTypeEnum.Move,
                gameId: gameId,
                fen: currentFen, // FEN after move
                initialFen: initialFen, // FEN before move
                walletAddress: walletAddress, // Required by API
                move: `${moveAttempt.from}${moveAttempt.to}`,
              };
              console.log("Sending WS Move (API-compliant):", wsMoveMessage);
              sendMessage(JSON.stringify(wsMoveMessage));

              setSelectedSquare(null);
              setValidMoves([]);
            } else {
              // Should not happen if validMoves check passed, but handle defensively
              console.error(
                "Local move failed despite validMoves check:",
                moveAttempt
              );
              toast.error("Invalid move attempt.");
              setSelectedSquare(null);
              setValidMoves([]);
            }
          } else {
            // --- Clicked invalid square or own piece again ---
            const pieceOnTarget = game.get(square);
            if (pieceOnTarget && pieceOnTarget.color === playerColor) {
              // Clicked another own piece - reselect
              setSelectedSquare(square);
              const legalMoves = game.moves({ square, verbose: true });
              setValidMoves(legalMoves.map((m) => m.to));
            } else {
              // Clicked invalid square or opponent piece - deselect
              setSelectedSquare(null);
              setValidMoves([]);
            }
          }
        } catch (error) {
          // Catch errors from game.move (though less likely with pre-validation)
          console.error("Error during move attempt:", error);
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    },
    [
      game,
      selectedSquare,
      playerTurn,
      playerColor, // Added playerColor dependency
      updateGameStatus,
      sendMessage,
      gameId,
      validMoves,
      winner,
      isOpponentConnected, // Added isOpponentConnected
    ]
  );

  // --- Resign Handler ---
  const handleResign = useCallback(() => {
    if (!gameId || !playerColor || winner || game.isGameOver()) return;

    // Confirmation dialog would be good here in a real app
    console.log("Sending Resign message");
    sendMessage(
      JSON.stringify({
        type: WebSocketMessageTypeEnum.Resign,
        gameId: gameId,
        // playerId: walletAddress // Server might identify by connection
      })
    );
    // Server should respond with a GAME_ENDED message
  }, [gameId, playerColor, sendMessage, winner, game]);

  // --- Player Names ---
  // Determine who is white/black based on assigned playerColor
  const whitePlayerName = playerColor === "w" ? "You" : opponentName;
  const blackPlayerName = playerColor === "b" ? "You" : opponentName;

  // --- Render Component ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-950 to-black text-white flex flex-col items-center p-4">
      {/* --- Header --- */}
      <div className="w-full max-w-6xl mx-auto mb-4 flex flex-row justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-gray-300 hover:text-black cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lobby/Home
        </Button>
        {/* --- Game Info Display --- */}
        <GameInfo
          gameMode="human"
          opponentName={opponentName}
          gameId={gameId || ""}
        />
        {/* --- Resign Button --- */}
        {!winner && !game.isGameOver() && isOpponentConnected && (
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

      {/* --- Status Display --- */}
      <div className="w-full max-w-xl mx-auto mb-4 text-center">
        <div
          className={`px-4 py-1 rounded-full inline-block ${
            winner || game.isGameOver()
              ? winner === playerColor ||
                (winner !== "draw" &&
                  winner !== (playerColor === "w" ? "b" : "w"))
                ? "bg-green-600/80" // Won
                : winner === "draw"
                ? "bg-gray-600/80" // Draw
                : "bg-red-700/80" // Lost
              : gameStatus.includes("check")
              ? "bg-yellow-600/80" // Check (use yellow instead of red for non-losing state)
              : "bg-gray-800/80" // Normal turn
          }`}
        >
          {gameStatus}
        </div>
      </div>

      {/* --- Main Game Area --- */}
      <div className="container max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
        {/* --- Left Panel: Black Player --- */}
        <PlayerPanel
          playerColor="b"
          playerName={blackPlayerName}
          isCurrentPlayer={playerTurn === "b"}
          timerValue={timers.b}
          capturedPieces={capturedPieces.b}
          moveHistory={moveHistory}
          getPieceImageUrl={helperUtil.getPieceImageUrl}
          formatTime={helperUtil.formatTime}
          isPlayer={playerColor === "b"}
          showRestartButton={false}
          isConnected={playerColor === "b" ? true : isOpponentConnected}
        />

        {/* --- Center: Board and Controls --- */}
        <div className="lg:order-0 -order-3 mb-6 lg:mb-0">
          <div className="aspect-square mx-auto relative max-w-xl">
            {/* --- Game Over Banner --- */}
            <AnimatePresence>
              {winner || game.isGameOver() ? (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 rounded-lg p-4"
                >
                  <div className="text-center">
                    <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-yellow-400 mb-3 sm:mb-4" />
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">
                      {gameStatus}
                    </h2>
                    {/* TODO: Offer Rematch / New Game options via WS? */}
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 cursor-pointer"
                      onClick={() => navigate("/")}
                    >
                      Back to Lobby/Home
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* --- Chess Board Component --- */}
            <ChessBoard
              board={game.board()}
              turn={playerTurn}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              handleSquareClick={handleSquareClick}
              lastMove={(() => {
                const historyVerbose = game.history({ verbose: true });
                return historyVerbose.length > 0
                  ? historyVerbose[historyVerbose.length - 1]
                  : null;
              })()}
              moveTrail={moveTrail}
              boardOrientation={
                playerColor === "w" || playerColor === "b" ? playerColor : "w"
              }
            />

            {/* --- FEN Display (Optional Debug) --- */}
            <div className="mt-4 text-xs text-gray-400 text-center break-all">
              <span className="font-mono bg-black/40 p-1 rounded select-all">
                {fen}
              </span>
            </div>
          </div>
        </div>

        {/* --- Right Panel: White Player --- */}
        <PlayerPanel
          playerColor="w"
          playerName={whitePlayerName}
          isCurrentPlayer={playerTurn === "w"}
          timerValue={timers.w}
          capturedPieces={capturedPieces.w}
          moveHistory={moveHistory}
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

// Utility: Calculate captured pieces from the current board state
function calculateCapturedPieces(
  board: ReturnType<Chess["board"]>
): ICapturedPieceData {
  // Standard chess starting piece counts
  const startingCounts = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
  };
  // Count current pieces on the board
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
  // Calculate captured pieces by comparing to starting counts
  const captured: ICapturedPieceData = { w: [], b: [] };
  (["w", "b"] as Color[]).forEach((color) => {
    (["p", "n", "b", "r", "q"] as PieceSymbol[]).forEach((type) => {
      const diff = startingCounts[color][type] - currentCounts[color][type];
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          captured[color === "w" ? "b" : "w"].push({ type, color });
        }
      }
    });
  });
  return captured;
}
