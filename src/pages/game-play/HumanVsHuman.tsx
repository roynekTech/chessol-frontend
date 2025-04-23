import { useState, useEffect, useCallback } from "react";
import { Chess, Square, Color, PieceSymbol } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft } from "lucide-react";
import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";

// --- Project Imports ---
import { ChessBoard } from "../../components/game/ChessBoard";
import { PlayerPanel } from "../../components/game/PlayerPanel";
import { GameInfo } from "../../components/game/GameInfo";
// TODO: Import WebSocket hooks/utils later

// Define the structure for captured pieces
interface ICapturedPieceData {
  w: { type: PieceSymbol; color: Color }[];
  b: { type: PieceSymbol; color: Color }[];
}

// --- HumanVsHuman Component ---
export function HumanVsHuman() {
  // --- Routing and URL Params ---
  const navigate = useNavigate();
  const location = useLocation(); // Keep location for potential future use (e.g., game ID from URL)
  const queryParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  // TODO: Extract gameId, playerColor from queryParams or WebSocket context later
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _queryParams = queryParams; // Temporarily disable warning until used

  // --- Core Game State ---
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [currentPlayer, setCurrentPlayer] = useState<Color>("w");
  const [gameStatus, setGameStatus] = useState("White to move");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<ICapturedPieceData>({
    w: [],
    b: [],
  });

  // --- Board Interaction State ---
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [moveTrail, setMoveTrail] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // --- Timer State ---
  const [timers, setTimers] = useState({ w: 600, b: 600 });
  const [activeTimer, setActiveTimer] = useState<Color | null>("w");

  // --- WebSocket State (Placeholders) ---
  // const [isConnected, setIsConnected] = useState(false);
  // const [opponentName, setOpponentName] = useState("Opponent");
  // const playerColor = 'w'; // This would come from WS connection/URL param

  // --- Helper Functions ---

  // --- Format time from seconds to MM:SS ---
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // --- Get Piece Image URL ---
  // TODO: Consolidate this into a shared util if used elsewhere
  const getPieceImageUrl = (piece: {
    type: PieceSymbol;
    color: Color;
  }): string => {
    const pieceImages: Record<string, string> = {
      wp: "https://www.chess.com/chess-themes/pieces/neo/150/wp.png",
      wn: "https://www.chess.com/chess-themes/pieces/neo/150/wn.png",
      wb: "https://www.chess.com/chess-themes/pieces/neo/150/wb.png",
      wr: "https://www.chess.com/chess-themes/pieces/neo/150/wr.png",
      wq: "https://www.chess.com/chess-themes/pieces/neo/150/wq.png",
      wk: "https://www.chess.com/chess-themes/pieces/neo/150/wk.png",
      bp: "https://www.chess.com/chess-themes/pieces/neo/150/bp.png",
      bn: "https://www.chess.com/chess-themes/pieces/neo/150/bn.png",
      bb: "https://www.chess.com/chess-themes/pieces/neo/150/bb.png",
      br: "https://www.chess.com/chess-themes/pieces/neo/150/br.png",
      bq: "https://www.chess.com/chess-themes/pieces/neo/150/bq.png",
      bk: "https://www.chess.com/chess-themes/pieces/neo/150/bk.png",
    };
    return pieceImages[`${piece.color}${piece.type}`] || "";
  };

  // --- Update game status, FEN, history, and current player ---
  const updateGameStatus = useCallback(() => {
    const turn = game.turn();
    setFen(game.fen());
    setCurrentPlayer(turn);
    setMoveHistory(game.history({ verbose: false }));

    if (game.isCheckmate()) {
      setGameStatus(`Checkmate! ${turn === "w" ? "Black" : "White"} wins`);
      setActiveTimer(null);
    } else if (game.isDraw()) {
      setGameStatus("Draw!");
      setActiveTimer(null);
    } else if (game.isStalemate()) {
      setGameStatus("Stalemate!");
      setActiveTimer(null);
    } else if (game.isInsufficientMaterial()) {
      setGameStatus("Draw due to insufficient material!");
      setActiveTimer(null);
    } else if (game.isThreefoldRepetition()) {
      setGameStatus("Draw due to threefold repetition!");
      setActiveTimer(null);
    } else if (game.isCheck()) {
      setGameStatus(`${turn === "w" ? "White" : "Black"} is in check!`);
      setActiveTimer(turn);
    } else {
      setGameStatus(`${turn === "w" ? "White" : "Black"} to move`);
      setActiveTimer(turn);
    }
  }, [game]);

  // --- Effects ---

  // --- Effect: Initialize game status ---
  useEffect(() => {
    updateGameStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // --- Effect: Update the timer every second ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    // TODO: Pause timer based on WebSocket opponent connection status?
    if (activeTimer && !game.isGameOver()) {
      interval = setInterval(() => {
        setTimers((prev) => {
          const newTime = Math.max(0, prev[activeTimer] - 1);
          if (newTime === 0) {
            setGameStatus(
              `${activeTimer === "w" ? "Black" : "White"} wins on time`
            );
            setActiveTimer(null);
            if (interval) clearInterval(interval);
            // TODO: Send timeout message via WebSocket?
          }
          return { ...prev, [activeTimer]: newTime };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer, game]);

  // --- Effect: Handle move trail animation timing ---
  useEffect(() => {
    if (moveTrail) {
      const timer = setTimeout(() => setMoveTrail(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [moveTrail]);

  // --- WebSocket Effects (Placeholder) ---
  // useEffect(() => {
  //   // Connect WebSocket, handle incoming messages (moves, chat, status)
  //   // Update game state based on opponent moves
  //   // Set isConnected, opponentName, playerColor
  // }, []);

  // --- Game Logic Functions ---

  // --- Handle Player's Click on a Square ---
  const handleSquareClick = useCallback(
    (square: Square) => {
      // Ignore clicks if game over
      // TODO: Add check: if (!isPlayerTurn(playerColor)) return;
      if (game.isGameOver()) {
        return;
      }

      if (!selectedSquare) {
        // Selecting a piece
        const piece = game.get(square);
        // TODO: Check if piece color matches assigned playerColor from WS
        if (piece && piece.color === currentPlayer) {
          setSelectedSquare(square);
          const legalMoves = game.moves({ square, verbose: true });
          setValidMoves(legalMoves.map((m) => m.to));
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      } else {
        // Making a move
        try {
          const moveAttempt = {
            from: selectedSquare,
            to: square,
            promotion: "q" as PieceSymbol,
          };
          // Check if the move is valid before making it
          const moveResult = game.move(moveAttempt);

          if (moveResult) {
            // TODO: Send move via WebSocket BEFORE making it locally?
            // Or make locally first and wait for confirmation?
            // Depends on desired UX and backend logic.

            // Make the move locally for immediate feedback
            if (moveResult.captured) {
              const capturedPiece = {
                type: moveResult.captured,
                color: moveResult.color === "w" ? "b" : "w",
              };
              setCapturedPieces((prev) => ({
                ...prev,
                [currentPlayer]: [...prev[currentPlayer], capturedPiece],
              }));
            }
            setSelectedSquare(null);
            setValidMoves([]);
            updateGameStatus(); // Update status locally

            // --- Send move via WebSocket ---
            // sendMessage({ type: 'MOVE', payload: { from: moveAttempt.from, to: moveAttempt.to, promotion: moveAttempt.promotion } });
          } else {
            // Invalid move target - deselect or reselect?
            const piece = game.get(square);
            if (piece && piece.color === currentPlayer) {
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
          console.error("Error during move attempt:", error);
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    },
    // TODO: Add dependencies like playerColor, isPlayerTurn, sendMessage
    [game, selectedSquare, currentPlayer, updateGameStatus]
  );

  // --- Restart Game Handler ---
  const restartGame = useCallback(() => {
    // TODO: In HvH, restart might need confirmation or opponent agreement via WS
    game.reset();
    setSelectedSquare(null);
    setValidMoves([]);
    setCapturedPieces({ w: [], b: [] });
    setTimers({ w: 600, b: 600 });
    setFen(game.fen());
    setMoveTrail(null);
    updateGameStatus();
    console.log("Game restarted (local)");
  }, [game, updateGameStatus]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _restartGame = restartGame; // Temporarily disable warning until button is added

  // --- Player Names (Placeholders) ---
  const whitePlayerName = "White Player"; // TODO: Get from WS/Auth
  const blackPlayerName = "Black Player"; // TODO: Get from WS/Auth

  // --- Render Component ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-blue-950 to-black text-white flex flex-col items-center p-4">
      {/* --- Header --- */}
      <div className="w-full max-w-6xl mx-auto mb-4 flex flex-row justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate("/")} // Navigate back
          className="text-gray-300 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {/* --- Game Info Display --- */}
        <GameInfo
          gameMode="human"
          // Pass actual values once WebSocket is implemented
          // opponentName={opponentName}
          // isConnected={isConnected}
          // gameId={gameId}
          // isSpectating={isSpectating}
        />
      </div>

      {/* --- Status Display --- */}
      <div className="w-full max-w-xl mx-auto mb-4 text-center">
        <div
          className={`px-4 py-1 rounded-full inline-block ${
            gameStatus.includes("Check")
              ? "bg-red-600/80"
              : game.isGameOver()
              ? "bg-green-600/80"
              : "bg-gray-800/80"
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
          isCurrentPlayer={currentPlayer === "b"}
          timerValue={timers.b}
          capturedPieces={capturedPieces.b} // Pieces captured by Black
          moveHistory={moveHistory}
          getPieceImageUrl={getPieceImageUrl}
          formatTime={formatTime}
          showRestartButton={false} // Restart handled differently in HvH
          // onRestart={restartGame} // Maybe add resign/draw buttons later
        />

        {/* --- Center: Board and Controls --- */}
        <div className="lg:order-none mb-6 lg:mb-0">
          <div className="aspect-square mx-auto relative max-w-xl">
            {/* --- Game Over Banner --- */}
            <AnimatePresence>
              {game.isGameOver() ? (
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
                    {/* TODO: Show appropriate buttons (New Game, Rematch?) */}
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2"
                      onClick={() => navigate("/")} // Go back home for now
                    >
                      Back to Lobby
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* --- Chess Board Component --- */}
            <ChessBoard
              board={game.board()}
              turn={currentPlayer}
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
              // TODO: Add board orientation based on playerColor from WS
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
          isCurrentPlayer={currentPlayer === "w"}
          timerValue={timers.w}
          capturedPieces={capturedPieces.w} // Pieces captured by White
          moveHistory={moveHistory}
          getPieceImageUrl={getPieceImageUrl}
          formatTime={formatTime}
          showRestartButton={false} // Restart handled differently in HvH
          // onRestart={restartGame}
        />
      </div>
    </div>
  );
}

export default HumanVsHuman;
