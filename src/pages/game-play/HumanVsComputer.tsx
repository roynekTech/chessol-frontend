import { useState, useEffect, useCallback } from "react";
import { Chess, Square, Color, PieceSymbol } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft } from "lucide-react";
import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

// --- Project Imports ---
import { estimateElo } from "../../utils/chessUtils";
import { usePostData } from "../../utils/use-query-hooks";
import { IGetBestMovePayload, IGetBestMoveResponse } from "../../utils/type";
import { ChessBoard } from "../../components/game/ChessBoard";
import { PlayerPanel } from "../../components/game/PlayerPanel";
import { GameInfo } from "../../components/game/GameInfo";

// Define the structure for captured pieces, using PieceSymbol from chess.js
interface ICapturedPieceData {
  w: { type: PieceSymbol; color: Color }[];
  b: { type: PieceSymbol; color: Color }[];
}

// --- HumanVsComputer Component ---
export function HumanVsComputer() {
  // --- Routing and URL Params ---
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  // --- Game Settings (from URL or defaults) ---
  const computerColor = (queryParams.get("computerColor") as Color) || "b"; // Default computer plays black
  const initialDifficulty = Number(queryParams.get("difficulty") || 10);
  // const spectateId = queryParams.get("spectate"); // Spectating not handled here yet

  // --- Core Game State ---
  const [game] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [currentPlayer, setCurrentPlayer] = useState<Color>("w");
  const [gameStatus, setGameStatus] = useState("White to move");
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [capturedPieces, setCapturedPieces] = useState<ICapturedPieceData>({
    w: [], // Pieces captured by white
    b: [], // Pieces captured by black
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

  // --- Computer Specific State ---
  const [difficulty] = useState<number>(initialDifficulty);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [thinkingToastId, setThinkingToastId] = useState<
    string | number | null
  >(null);
  const [computerMoveData, setComputerMoveData] = useState<{
    from: Square;
    to: Square;
    bestMove: string;
    promotion?: PieceSymbol;
  } | null>(null);
  const [computerMoveFailCount, setComputerMoveFailCount] = useState(0); // State for failure count

  // --- API Hook for Best Move ---
  const { mutate: getBestMove } = usePostData<
    IGetBestMoveResponse,
    IGetBestMovePayload
  >("get_best_move", ["move"]); // Query key might need refinement

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
    setMoveHistory(game.history({ verbose: false })); // Get basic history

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
      setActiveTimer(turn); // Keep timer running in check
    } else {
      setGameStatus(`${turn === "w" ? "White" : "Black"} to move`);
      setActiveTimer(turn); // Switch timer
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
          }
          return { ...prev, [activeTimer]: newTime };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // Pass game instance to dependency array if its methods cause re-renders
  }, [activeTimer, game]); // Removed `timers` from deps to avoid loop

  // --- Effect: Handle move trail animation timing ---
  useEffect(() => {
    if (moveTrail) {
      const timer = setTimeout(() => setMoveTrail(null), 1500); // Trail duration
      return () => clearTimeout(timer);
    }
  }, [moveTrail]);

  // --- Effect: Show/Dismiss Thinking Toast ---
  useEffect(() => {
    if (isThinking) {
      const id = toast.loading("Computer is thinking...", {
        duration: Infinity,
        description: `Difficulty: ${difficulty} (~${estimateElo(
          difficulty
        )} ELO)`,
      });
      setThinkingToastId(id);
    } else {
      if (thinkingToastId) {
        toast.dismiss(thinkingToastId);
        setThinkingToastId(null);
      }
    }
    // Cleanup on unmount
    return () => {
      if (thinkingToastId) toast.dismiss(thinkingToastId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isThinking, difficulty]); // Add difficulty here to update toast description if it changes

  // --- Effect: Reset failure count when it's not computer's turn ---
  useEffect(() => {
    if (currentPlayer !== computerColor) {
      if (computerMoveFailCount > 0) {
        console.log(
          "[Effect ResetFailCount] Resetting computerMoveFailCount from",
          computerMoveFailCount,
          "to 0"
        );
        setComputerMoveFailCount(0);
      }
    }
  }, [currentPlayer, computerColor, computerMoveFailCount]);

  // --- Effect: Trigger Computer's Move ---
  useEffect(() => {
    if (currentPlayer === computerColor && !isThinking && !game.isGameOver()) {
      // --- Check Failure Count ---
      if (computerMoveFailCount >= 2) {
        console.error(
          `[Effect TriggerComputer] Max retries (${computerMoveFailCount}) reached. Aborting move fetch.`
        );
        toast.error(
          "Failed to get computer move after multiple attempts. Please restart or try again later."
        );
        setIsThinking(false); // Stop the thinking indicator
        // Optionally: set game status to an error state?
        return; // Do not proceed with API call
      }
      // --- End Check ---

      setIsThinking(true);

      getBestMove(
        {
          fen: game.fen(), // Use current FEN
          game_id: "hvc_game", // Placeholder game ID
          level: difficulty,
        },
        {
          onSuccess: (data) => {
            console.log(
              "[Effect TriggerComputer] getBestMove onSuccess:",
              data
            );
            setComputerMoveFailCount(0); // Reset failure count on success
            if (data?.best_move) {
              setComputerMoveData({
                from: data.best_move.slice(0, 2) as Square,
                to: data.best_move.slice(2, 4) as Square,
                promotion: (data.best_move.length > 4
                  ? data.best_move.slice(4, 5)
                  : undefined) as PieceSymbol | undefined,
                bestMove: data.best_move, // Keep original string if needed
              });
            } else {
              console.error(
                "[Effect TriggerComputer] API response missing best_move"
              );
              setIsThinking(false);
              console.log(
                "[Effect TriggerComputer] Set isThinking=false (API missing data)"
              );
            }
          },
          onError: (error) => {
            console.error(
              "[Effect TriggerComputer] getBestMove onError:",
              error
            );
            setComputerMoveFailCount((prev) => prev + 1); // Increment failure count
            toast.error(
              `Error getting computer move (Attempt ${
                computerMoveFailCount + 1
              }).`
            ); // Show attempt number
            setIsThinking(false);
            console.log(
              `[Effect TriggerComputer] Set isThinking=false (API error). Fail count: ${
                computerMoveFailCount + 1
              }`
            );
          },
        }
      );
    }
  }, [
    currentPlayer,
    computerColor,
    isThinking,
    game,
    getBestMove,
    difficulty,
    computerMoveFailCount, // Add fail count to dependencies
  ]);

  // --- Effect: Process Computer's Move once received ---
  useEffect(() => {
    console.log(
      `[Effect ProcessComputerMove] Checking conditions: isThinking=${isThinking}, computerMoveData=`,
      computerMoveData,
      `isGameOver=${game.isGameOver()}`
    );
    if (isThinking && computerMoveData && !game.isGameOver()) {
      console.log(
        "[Effect ProcessComputerMove] Conditions met. Attempting game.move()."
      );
      try {
        const move = game.move({
          from: computerMoveData.from,
          to: computerMoveData.to,
          promotion: computerMoveData.promotion || "q", // Default promotion
        });

        if (move) {
          console.log(
            "[Effect ProcessComputerMove] game.move() successful:",
            move.san
          );
          setMoveTrail({ from: move.from, to: move.to }); // Set trail for visual feedback

          // --- Handle Captures by Computer ---
          if (move.captured) {
            const capturedPiece = {
              type: move.captured,
              color: move.color === "w" ? "b" : "w", // The color of the piece captured
            };
            setCapturedPieces((prev) => ({
              ...prev,
              [move.color]: [...prev[move.color], capturedPiece], // Add to computer's captured list
            }));
          }

          updateGameStatus(); // Update status after computer move
          console.log(
            "[Effect ProcessComputerMove] updateGameStatus() called."
          );
        } else {
          console.error(
            "[Effect ProcessComputerMove] Invalid computer move generated:",
            computerMoveData
          );
        }
      } catch (error) {
        console.error(
          "[Effect ProcessComputerMove] Error executing computer move:",
          error,
          computerMoveData
        );
      } finally {
        console.log(
          "[Effect ProcessComputerMove] Finished processing. Clearing move data and setting isThinking=false."
        );
        setComputerMoveData(null); // Clear the move data
        setIsThinking(false); // Computer finished thinking
      }
    }
  }, [computerMoveData, isThinking, game, updateGameStatus]);

  // --- Game Logic Functions ---

  // --- Handle Human Player's Click on a Square ---
  const handleSquareClick = useCallback(
    (square: Square) => {
      // Ignore clicks if game over, or if it's computer's turn
      if (game.isGameOver() || currentPlayer === computerColor) {
        return;
      }

      if (!selectedSquare) {
        // --- Selecting a piece ---
        const piece = game.get(square);
        // Check if it's a piece and belongs to the current player
        if (piece && piece.color === currentPlayer) {
          setSelectedSquare(square);
          const legalMoves = game.moves({ square, verbose: true });
          setValidMoves(legalMoves.map((m) => m.to));
        } else {
          // Clicked on empty square or opponent's piece without selection
          setSelectedSquare(null);
          setValidMoves([]);
        }
      } else {
        // --- Making a move ---
        try {
          const move = game.move({
            from: selectedSquare,
            to: square,
            promotion: "q", // Auto-promote to queen for simplicity - enhance later
          });

          if (move) {
            // --- Move Successful ---
            setMoveTrail({ from: selectedSquare, to: square }); // Show move trail

            // --- Handle Captures by Human ---
            if (move.captured) {
              const capturedPiece = {
                type: move.captured,
                color: move.color === "w" ? "b" : "w", // Color of the captured piece
              };
              setCapturedPieces((prev) => ({
                ...prev,
                // Add to the list of pieces captured by the current (human) player
                [currentPlayer]: [...prev[currentPlayer], capturedPiece],
              }));
            }
            setSelectedSquare(null); // Clear selection
            setValidMoves([]); // Clear valid moves
            updateGameStatus(); // Update game status
          } else {
            // --- Move Invalid (but attempted) ---
            // Check if clicking on another of player's own pieces to re-select
            const piece = game.get(square);
            if (piece && piece.color === currentPlayer) {
              setSelectedSquare(square);
              const legalMoves = game.moves({ square, verbose: true });
              setValidMoves(legalMoves.map((m) => m.to));
            } else {
              // Clicked invalid square or opponent piece
              setSelectedSquare(null);
              setValidMoves([]);
            }
          }
        } catch (error) {
          // --- Error during move attempt (library might throw) ---
          console.log("Invalid move attempt:", error);
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    },
    [game, selectedSquare, currentPlayer, computerColor, updateGameStatus]
  );

  // --- Restart Game Handler ---
  const restartGame = useCallback(() => {
    game.reset();
    setSelectedSquare(null);
    setValidMoves([]);
    setCapturedPieces({ w: [], b: [] });
    setTimers({ w: 600, b: 600 });
    setFen(game.fen());
    setMoveTrail(null);
    setComputerMoveData(null);
    setIsThinking(false); // Ensure computer isn't stuck thinking
    if (thinkingToastId) toast.dismiss(thinkingToastId);
    setThinkingToastId(null);
    updateGameStatus(); // This will set currentPlayer and activeTimer correctly
    console.log("Game restarted");
  }, [game, updateGameStatus, thinkingToastId]);

  // --- Determine player names ---
  const whitePlayerName = computerColor === "w" ? "Computer" : "You";
  const blackPlayerName = computerColor === "b" ? "Computer" : "You";

  // --- Render Component ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white flex flex-col items-center p-4">
      {/* --- Header --- */}
      <div className="w-full max-w-6xl mx-auto mb-4 flex flex-row justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate("/games")} // Go back to setup or main menu
          className="text-gray-300 hover:text-black cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {/* --- Game Info Display --- */}
        <GameInfo
          gameMode="computer"
          difficulty={difficulty}
          playerColor={computerColor === "w" ? "b" : "w"} // Human player's color
          // isSpectating={isSpectating} // Pass if spectating state is managed here
        />
      </div>

      {/* --- Status Display --- */}
      <div className="w-full max-w-xl mx-auto mb-4 text-center">
        <div
          className={`px-4 py-1 rounded-full inline-block ${
            gameStatus.includes("Check")
              ? "bg-red-600/80"
              : gameStatus.includes("wins") ||
                gameStatus.includes("Draw") ||
                gameStatus.includes("Stalemate")
              ? "bg-green-600/80"
              : "bg-gray-800/80"
          }`}
        >
          {gameStatus}
        </div>
        {/* Toast handles thinking indicator */}
      </div>

      {/* --- Main Game Area --- */}
      <div className="container max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-start">
        {/* --- Left Panel: Player determined by computerColor --- */}
        <PlayerPanel
          playerColor={computerColor === "w" ? "b" : "w"} // The human player
          playerName={computerColor === "w" ? blackPlayerName : whitePlayerName}
          isCurrentPlayer={
            currentPlayer === (computerColor === "w" ? "b" : "w")
          }
          timerValue={computerColor === "w" ? timers.b : timers.w}
          capturedPieces={
            computerColor === "w" ? capturedPieces.b : capturedPieces.w
          } // Pieces captured by this player
          moveHistory={moveHistory}
          getPieceImageUrl={getPieceImageUrl}
          formatTime={formatTime}
          showRestartButton={true} // Show button in panels on desktop
          onRestart={restartGame}
        />

        {/* --- Center: Board and Controls --- */}
        <div className="lg:order-0 -order-3 mb-6 lg:mb-0">
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
                      {gameStatus} {/* Display the final status */}
                    </h2>
                    <Button
                      className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-2"
                      onClick={restartGame}
                    >
                      Play Again
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* --- Chess Board Component --- */}
            <ChessBoard
              board={game.board()} // Pass the board state
              turn={currentPlayer}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              handleSquareClick={handleSquareClick}
              // Get the last move object correctly
              lastMove={(() => {
                const historyVerbose = game.history({ verbose: true });
                return historyVerbose.length > 0
                  ? historyVerbose[historyVerbose.length - 1]
                  : null;
              })()}
              moveTrail={moveTrail}
              // TODO: Add board orientation based on player color
            />

            {/* --- FEN Display (Optional) --- */}
            <div className="mt-4 text-xs text-gray-400 text-center break-all">
              <span className="font-mono bg-black/40 p-1 rounded select-all">
                {fen}
              </span>
            </div>
          </div>
        </div>

        {/* --- Right Panel: Player determined by computerColor --- */}
        <PlayerPanel
          playerColor={computerColor} // The computer player
          playerName={computerColor === "w" ? whitePlayerName : blackPlayerName}
          isCurrentPlayer={currentPlayer === computerColor}
          timerValue={timers[computerColor]}
          capturedPieces={capturedPieces[computerColor]} // Pieces captured by computer
          moveHistory={moveHistory}
          getPieceImageUrl={getPieceImageUrl}
          formatTime={formatTime}
          onRestart={restartGame}
        />
      </div>
    </div>
  );
}

export default HumanVsComputer;
