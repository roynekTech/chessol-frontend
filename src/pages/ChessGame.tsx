import { useState, useEffect, useCallback } from "react";
import { Chess, Square } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Crown, Clock, RotateCw, Trophy, ArrowLeft } from "lucide-react";
import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { estimateElo } from "../utils/chessUtils";
import { useGetData } from "../utils/use-query-hooks";

interface MoveResponse {
  bestMove: string;
  from: string;
  to: string;
  promotion?: string;
}

// Simplified chess board component to avoid TypeScript issues with chess.js
export function ChessGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  // Get game settings from URL parameters
  const initialMode = queryParams.get("mode") || "computer";
  const computerColor = queryParams.get("computerColor") || "b";
  const initialDifficulty = Number(queryParams.get("difficulty") || 10);
  const spectateId = queryParams.get("spectate");

  // Add spectate mode state
  const [isSpectating, setIsSpectating] = useState(!!spectateId);

  const [gameMode, setGameMode] = useState(initialMode);
  const [game] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<"w" | "b">("w");
  const [gameStatus, setGameStatus] = useState("");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState({
    w: [] as { type: string; color: string }[],
    b: [] as { type: string; color: string }[],
  });

  // extract the game mode from the url
  useEffect(() => {
    const mode = queryParams.get("mode");
    if (mode) {
      setGameMode(mode);
    }
  }, [queryParams]);

  // Game timer
  const [timers, setTimers] = useState({
    w: 600, // 10 minutes in seconds
    b: 600,
  });
  const [activeTimer, setActiveTimer] = useState<string>("w"); // White starts

  // Add FEN state back
  const [fen, setFen] = useState(game.fen());
  const [difficulty, setDifficulty] = useState<number>(initialDifficulty);
  const [isThinking, setIsThinking] = useState<boolean>(false);

  // Move trail animation
  const [moveTrail, setMoveTrail] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Move the hook call after all required variables are declared
  const { data: moveResponse } = useGetData<MoveResponse>(
    `api/games/get-move?fen=${fen}&depth=${difficulty}&skill=${difficulty}`,
    ["chess", "move", fen, difficulty.toString()],
    {
      enabled: gameMode === "computer" && currentPlayer === computerColor,
    }
  );
  const moveData = moveResponse?.data;

  console.log("moveData", moveData);

  // Function to adjust difficulty (not exposed in UI yet)
  const adjustDifficulty = useCallback((newDifficulty: number) => {
    // Clamp difficulty between 1-20
    const clampedDifficulty = Math.min(20, Math.max(1, newDifficulty));
    setDifficulty(clampedDifficulty);
    console.log(
      `Difficulty adjusted to: ${clampedDifficulty} (ELO ~${estimateElo(
        clampedDifficulty
      )})`
    );
  }, []);

  // Add keyboard shortcuts for debugging and power users
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only in development or for power users
      if (event.ctrlKey && event.shiftKey) {
        // Ctrl+Shift+ArrowUp/ArrowDown to adjust difficulty
        if (event.key === "ArrowUp") {
          adjustDifficulty(difficulty + 1);
        } else if (event.key === "ArrowDown") {
          adjustDifficulty(difficulty - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [adjustDifficulty, difficulty]);

  // Fetch game data if spectating
  useEffect(() => {
    if (spectateId) {
      // In a real app, this would fetch the game data from an API
      console.log(`Spectating game with ID: ${spectateId}`);
      setIsSpectating(true);

      // Mock implementation - in reality you would fetch actual game data
      // and set up a websocket or polling to get move updates
    }
  }, [spectateId]);

  // Format time from seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Update the timer every second
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeTimer && !game.isGameOver()) {
      interval = setInterval(() => {
        setTimers((prev) => ({
          ...prev,
          [activeTimer as keyof typeof prev]: Math.max(
            0,
            prev[activeTimer as keyof typeof prev] - 1
          ),
        }));

        // Check for timeout
        if (timers[activeTimer as keyof typeof timers] <= 0) {
          setGameStatus(
            `${activeTimer === "w" ? "Black" : "White"} wins on time`
          );
          setActiveTimer("");
          if (interval) clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer, timers, game]);

  // Update game status after each move
  const updateGameStatus = useCallback(() => {
    // Update FEN
    setFen(game.fen());
    setCurrentPlayer(game.turn() as "w" | "b");

    if (game.isCheckmate()) {
      setGameStatus(
        `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins`
      );
      setActiveTimer("");
    } else if (game.isDraw()) {
      setGameStatus("Draw!");
      setActiveTimer("");
    } else if (game.isStalemate()) {
      setGameStatus("Stalemate!");
      setActiveTimer("");
    } else if (game.isCheck()) {
      setGameStatus(`${game.turn() === "w" ? "White" : "Black"} is in check!`);
    } else {
      setGameStatus(`${game.turn() === "w" ? "White" : "Black"} to move`);
    }

    // Update move history
    setMoveHistory(game.history());
  }, [game]);

  // Handle move trail animation
  useEffect(() => {
    if (moveTrail) {
      const timer = setTimeout(() => {
        setMoveTrail(null);
      }, 2000); // Keep trail for 2 seconds

      return () => clearTimeout(timer);
    }
  }, [moveTrail]);

  // Trigger computer's turn by setting isThinking flag (enables data fetch)
  useEffect(() => {
    console.log("Computer turn check - gameMode:", {
      gameMode,
      computerColor,
      currentPlayer,
      isThinking,
      isGameOver: game.isGameOver(),
    });

    if (
      gameMode === "computer" &&
      computerColor === currentPlayer &&
      !isThinking &&
      !game.isGameOver()
    ) {
      console.log(
        "Computer's turn, setting isThinking to true to trigger fetch..."
      );
      setIsThinking(true);
      // The useGetData hook will now fetch because 'enabled' is true and fen/difficulty might change.
    }
    // Add game to dependencies to re-evaluate if game over state changes
  }, [currentPlayer, computerColor, gameMode, isThinking, game]);

  // Effect to process the computer's move once moveData is available
  useEffect(() => {
    // Only proceed if the computer is thinking and we have move data
    if (isThinking && moveData) {
      console.log("Received moveData while thinking:", moveData);
      try {
        // Optional: Short delay for perceived thinking, can be removed
        // await new Promise(resolve => setTimeout(resolve, 100));

        const move = game.move({
          from: moveData.from,
          to: moveData.to,
          // Ensure promotion defaults to 'q' if not provided, matching human move logic
          promotion: moveData.promotion || "q",
        });

        if (move) {
          console.log("Computer move successful:", move);
          setMoveTrail({ from: move.from, to: move.to });

          if (move.captured) {
            const capturedPiece = {
              type: move.captured,
              // The color of the captured piece is the *opposite* of the mover's color
              color: move.color === "w" ? "b" : "w",
            };
            setCapturedPieces((prev) => {
              // Ensure we update the correct side's captured pieces array
              const opponentColor = move.color === "w" ? "b" : "w";
              return {
                ...prev,
                [opponentColor]: [...prev[opponentColor], capturedPiece],
              };
            });
          }

          // *** CORE FIX: Update status *after* the move is made ***
          updateGameStatus();
          // Switch timer *after* updating status (which updates game.turn())
          setActiveTimer(game.turn() as string);
        } else {
          // This indicates the move received from the API was illegal for the current position
          console.error(
            "Computer move failed: Invalid move received from API or illegal move",
            moveData,
            `FEN: ${game.fen()}`
          );
          // Consider how to handle this - maybe skip turn, show error?
          // For now, just stop thinking to prevent infinite loops if API keeps sending bad moves.
        }
      } catch (error) {
        // This catches errors from game.move() itself (e.g., if moveData is malformed)
        console.error(
          "Error executing computer move:",
          error,
          moveData,
          `FEN: ${game.fen()}`
        );
      } finally {
        // Crucial: Reset thinking state regardless of success or failure
        console.log(
          "Computer finished processing move, setting isThinking to false."
        );
        setIsThinking(false);
      }
    }
    // This effect should run when moveData potentially updates, but only act if isThinking is true.
    // Including game and updateGameStatus ensures the latest game state and functions are used.
  }, [moveData, isThinking, game, updateGameStatus]);

  // Initialize the game state
  useEffect(() => {
    updateGameStatus();
  }, [updateGameStatus]);

  // Modify handleSquareClick to prevent moves when spectating
  const handleSquareClick = (square: string) => {
    try {
      // Return early if game is over, if we're spectating, or if it's the computer's turn
      if (
        game.isGameOver() ||
        isSpectating ||
        (gameMode === "computer" && game.turn() === computerColor)
      )
        return;

      if (selectedSquare) {
        // Try to make a move
        try {
          const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: "q", // Auto-promote to queen for simplicity
          });

          if (move) {
            // Add move trail animation
            setMoveTrail({
              from: selectedSquare,
              to: square,
            });

            // Check for captures
            if (move.captured) {
              const capturedPiece = {
                type: move.captured,
                color: move.color === "w" ? "b" : "w",
              };
              setCapturedPieces((prev) => ({
                ...prev,
                [move.color]: [
                  ...prev[move.color as keyof typeof prev],
                  capturedPiece,
                ],
              }));
            }

            // Clear selection
            setSelectedSquare(null);
            setValidMoves([]);

            // Switch active timer
            setActiveTimer(game.turn() as string);

            // Update game status
            updateGameStatus();
          }
        } catch {
          // Invalid move - check if we're trying to select a new piece
          try {
            const piece = game.get(square as Square);
            if (piece && piece.color === game.turn()) {
              selectSquare(square);
            } else {
              // Invalid target, clear selection
              setSelectedSquare(null);
              setValidMoves([]);
            }
          } catch {
            // If anything fails, just clear the selection
            setSelectedSquare(null);
            setValidMoves([]);
          }
        }
      } else {
        // If no square is selected yet, try to select a piece
        try {
          const piece = game.get(square as Square);
          if (piece && piece.color === game.turn()) {
            selectSquare(square);
          }
        } catch {
          // Just ignore errors when trying to select a square
        }
      }
    } catch {
      console.log("Error in handleSquareClick");
    }
  };

  // Select a square and show valid moves
  const selectSquare = (square: string) => {
    setSelectedSquare(square);
    try {
      // Find valid moves for the selected piece
      const legalMoves =
        game.moves({ square: square as Square, verbose: true }) || [];
      const validDestinations = legalMoves.map((move) => move.to || "");
      setValidMoves(validDestinations);
    } catch {
      setValidMoves([]);
    }
  };

  // Piece images mapping
  const getPieceImage = (piece: { type: string; color: string } | null) => {
    if (!piece) return "";

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

    return pieceImages[`${piece.color}${piece.type}`];
  };

  // Create board position from FEN
  const renderBoard = () => {
    // Generate a static 8x8 board with coordinates
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    // Get the current position from chess.js
    const position = game.board();

    return (
      <div className="grid grid-cols-8 gap-0 border-4 border-amber-900 rounded-lg overflow-hidden shadow-xl">
        {ranks
          .map((rank, rankIndex) =>
            files.map((file, fileIndex) => {
              const squareId = file + rank;
              const isLight = (fileIndex + rankIndex) % 2 === 1;
              const squareColor = isLight ? "bg-amber-200" : "bg-amber-800";

              // Find piece at this position
              const piece = position[rankIndex][fileIndex];

              // Determine if square needs highlighting
              let highlightClass = "";

              // Track the move trail
              const isFromSquare = moveTrail && moveTrail.from === squareId;
              const isToSquare = moveTrail && moveTrail.to === squareId;

              if (selectedSquare === squareId) {
                highlightClass = "ring-4 ring-yellow-400 z-10";
              } else if (validMoves.includes(squareId)) {
                highlightClass = piece
                  ? "ring-4 ring-red-500 z-10"
                  : "after:content-[''] after:absolute after:inset-0 after:m-auto after:w-3 after:h-3 after:rounded-full after:bg-gray-500/60";
              } else if (isFromSquare) {
                highlightClass = "bg-blue-500/50";
              } else if (isToSquare) {
                highlightClass = "bg-green-500/50";
              }

              // Check if this square was part of the last move
              const lastMove =
                moveHistory.length > 0
                  ? game.history({ verbose: true }).pop()
                  : null;
              if (
                lastMove &&
                (lastMove.from === squareId || lastMove.to === squareId) &&
                !isFromSquare &&
                !isToSquare // Don't override move trail highlights
              ) {
                highlightClass += " bg-yellow-400/30";
              }

              return (
                <div
                  key={squareId}
                  className={`${squareColor} ${highlightClass} relative aspect-square`}
                  onClick={() => handleSquareClick(squareId)}
                >
                  {/* Show coordinates */}
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

                  {/* Render piece */}
                  {piece && (
                    <motion.div
                      key={`${piece.color}${piece.type}-${squareId}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <img
                        src={getPieceImage(piece)}
                        alt={`${piece.color}${piece.type}`}
                        className="w-4/5 h-4/5 object-contain"
                        draggable={false}
                      />
                    </motion.div>
                  )}
                </div>
              );
            })
          )
          .flat()}
      </div>
    );
  };

  // Create a component for the move history display that alternates white and black moves
  const MoveHistoryDisplay = () => {
    if (moveHistory.length === 0) {
      return (
        <div className="text-gray-500 text-sm italic text-center py-4">
          No moves yet
        </div>
      );
    }

    // Group moves into pairs (white, black)
    const pairs = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        number: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: i + 1 < moveHistory.length ? moveHistory[i + 1] : null,
      });
    }

    return (
      <div className="grid grid-cols-[auto_1fr_1fr] gap-1">
        {pairs.map((pair, idx) => (
          <React.Fragment key={idx}>
            <div className="text-gray-500 text-xs p-1 text-right">
              {pair.number}.
            </div>
            <div className="bg-gray-800/50 p-1 rounded text-sm font-mono">
              <span className="text-white font-bold">w:</span> {pair.white}
            </div>
            {pair.black ? (
              <div className="bg-gray-800/50 p-1 rounded text-sm font-mono">
                <span className="text-amber-400 font-bold">b:</span>{" "}
                {pair.black}
              </div>
            ) : (
              <div></div> // Empty cell if no black move
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Action buttons
  const restartGame = () => {
    game.reset();
    setSelectedSquare(null);
    setValidMoves([]);
    setCapturedPieces({ w: [], b: [] });
    setCurrentPlayer("w");
    setActiveTimer("w");
    setTimers({ w: 600, b: 600 });
    setFen(game.fen());
    setMoveTrail(null);
    updateGameStatus();

    // Start computer move if computer plays as white
    if (gameMode === "computer" && computerColor === "w") {
      setTimeout(() => {
        setIsThinking(true);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white flex flex-col items-center justify-center p-4">
      {/* Game header - more mobile friendly */}
      <div className="w-full max-w-6xl mx-auto mb-4 flex flex-col sm:flex-row justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate(isSpectating ? "/games" : "/")}
          className="text-gray-300 hover:text-black mb-4 sm:mb-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="bg-black/50 p-3 rounded-lg shadow-lg mb-4 sm:mb-0">
          <div className="grid grid-cols-1 gap-2">
            {isSpectating && (
              <div className="text-sm bg-purple-900/50 px-3 py-1 rounded-full text-center">
                <span className="font-semibold">Spectator Mode</span>
              </div>
            )}
            <div className="text-sm">
              <span className="text-gray-400">Mode:</span>{" "}
              <span className="font-semibold">
                {gameMode === "human" ? "Human vs Human" : "Play vs Computer"}
              </span>
            </div>

            {gameMode === "computer" && (
              <>
                <div className="text-sm">
                  <span className="text-gray-400">Playing as:</span>{" "}
                  <span className="font-semibold">
                    {computerColor === "b" ? "White" : "Black"}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-gray-400">Computer ELO:</span>{" "}
                  <span className="font-semibold">
                    ~{estimateElo(difficulty)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content container */}
      <div className="container max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Center - Chess board - prioritized on mobile */}
        <div className="lg:col-span-1 lg:order-2 mb-6 lg:mb-0">
          <div className="aspect-square mx-auto relative max-w-xl">
            {/* Game status banner */}
            <AnimatePresence>
              {gameStatus.includes("wins") && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 rounded-lg"
                >
                  <div className="text-center p-6 rounded-lg">
                    <Trophy className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-2xl font-bold mb-4">{gameStatus}</h2>
                    <Button
                      className="bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                      onClick={restartGame}
                    >
                      Play Again
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status bar - improved position */}
            <div className="absolute -top-10 left-0 right-0 text-center">
              <div
                className={`px-4 py-1 rounded-full inline-block ${
                  gameStatus.includes("Check")
                    ? "bg-red-600/80"
                    : "bg-gray-800/80"
                }`}
              >
                {gameStatus}
              </div>
            </div>

            {/* Thinking indicator */}
            {isThinking && (
              <div className="absolute -top-20 left-0 right-0 text-center z-20">
                <div className="px-4 py-2 rounded-full inline-flex items-center gap-2 bg-blue-600/80">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  <span>Computer is thinking...</span>
                </div>
              </div>
            )}

            {/* Chess board rendered dynamically */}
            {renderBoard()}

            {/* Mobile-friendly restart controls */}
            <div className="mt-4 flex justify-center lg:hidden">
              <Button
                variant="default"
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-2"
                onClick={restartGame}
              >
                <RotateCw className="w-4 h-4 mr-2" /> Restart
              </Button>
            </div>

            {/* FEN Display - hidden on mobile */}
            <div className="mt-4 hidden sm:block text-xs text-gray-400 overflow-x-auto whitespace-nowrap">
              <div className="font-mono bg-black/40 p-2 rounded">{fen}</div>
            </div>
          </div>
        </div>

        {/* Left panel - Black player - improved mobile layout */}
        <div className="bg-black/30 rounded-lg p-4 lg:order-1 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="bg-black rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white mr-3 sm:mr-4">
              <Crown
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  currentPlayer === "b" ? "text-yellow-400" : "text-gray-500"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg">Black Player</h3>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-red-400" />
                <span
                  className={`${
                    timers.b < 60 ? "text-red-500" : "text-gray-300"
                  }`}
                >
                  {formatTime(timers.b)}
                </span>
              </div>
            </div>
          </div>

          {/* Captured pieces by Black - more compact on mobile */}
          <div className="mb-3 sm:mb-4">
            <h4 className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
              Captured
            </h4>
            <div className="flex flex-wrap gap-1">
              {capturedPieces.b.map((piece, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-6 h-6 sm:w-8 sm:h-8"
                >
                  <img
                    src={getPieceImage(piece)}
                    alt={`${piece.color}${piece.type}`}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Move history for Black - responsive height */}
          <div className="flex-1 overflow-hidden">
            <h4 className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
              Moves
            </h4>
            <div className="bg-black/40 rounded p-2 max-h-32 sm:max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-black/20 scrollbar-thumb-gray-700">
              <MoveHistoryDisplay />
            </div>
          </div>

          {/* Game controls - desktop only */}
          <div className="mt-4 gap-2 hidden lg:flex">
            <Button
              variant="default"
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              onClick={restartGame}
            >
              <RotateCw className="w-4 h-4 mr-2" /> Restart
            </Button>
          </div>
        </div>

        {/* Right panel - White player - improved mobile layout */}
        <div className="bg-black/30 rounded-lg p-4 lg:order-3 flex flex-col">
          <div className="flex items-center mb-4">
            <div className="bg-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-black mr-3 sm:mr-4">
              <Crown
                className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  currentPlayer === "w" ? "text-yellow-400" : "text-gray-500"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg">White Player</h3>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-red-400" />
                <span
                  className={`${
                    timers.w < 60 ? "text-red-500" : "text-gray-300"
                  }`}
                >
                  {formatTime(timers.w)}
                </span>
              </div>
            </div>
          </div>

          {/* Captured pieces by White - more compact on mobile */}
          <div className="mb-3 sm:mb-4">
            <h4 className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
              Captured
            </h4>
            <div className="flex flex-wrap gap-1">
              {capturedPieces.w.map((piece, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-6 h-6 sm:w-8 sm:h-8"
                >
                  <img
                    src={getPieceImage(piece)}
                    alt={`${piece.color}${piece.type}`}
                    className="w-full h-full object-contain"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Move history for White - responsive height */}
          <div className="flex-1 overflow-hidden">
            <h4 className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
              Moves
            </h4>
            <div className="bg-black/40 rounded p-2 max-h-32 sm:max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-black/20 scrollbar-thumb-gray-700">
              <MoveHistoryDisplay />
            </div>
          </div>

          {/* Game controls - desktop only */}
          <div className="mt-4 gap-2 hidden lg:flex">
            <Button
              variant="default"
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white"
              onClick={restartGame}
            >
              <RotateCw className="w-4 h-4 mr-2" /> Restart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChessGame;
