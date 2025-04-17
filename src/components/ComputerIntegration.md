# Integrating Stockfish Computer Player with ChessGame Component

This guide explains how to integrate the Stockfish API with the existing ChessGame component to allow playing against the computer.

## Step 1: Add Game Mode State

Add these state variables to your ChessGame component:

```tsx
// Computer player settings
const [gameMode, setGameMode] = useState<"human" | "computer">("human");
const [computerColor, setComputerColor] = useState<"w" | "b">("b");
const [difficulty, setDifficulty] = useState<number>(10);
const [isThinking, setIsThinking] = useState<boolean>(false);
```

## Step 2: Initialize Stockfish Service

Import and initialize the Stockfish service:

```tsx
import { StockfishService } from "../services/stockfishService";
import { toSquare } from "../utils/chessUtils";

// Initialize Stockfish service
const stockfish = useMemo(() => new StockfishService(), []);

// Check if Stockfish is available
useEffect(() => {
  const checkStockfish = async () => {
    try {
      const available = await stockfish.isAvailable();
      if (!available && gameMode === "computer") {
        console.warn(
          "Stockfish API is not available, falling back to human mode"
        );
        setGameMode("human");
      }
    } catch (error) {
      console.error("Error checking Stockfish availability:", error);
      setGameMode("human");
    }
  };

  checkStockfish();
}, [stockfish, gameMode]);
```

## Step 3: Add Computer Move Logic

Add a function to get the computer's move:

```tsx
// Function to get and apply computer move
const getComputerMove = useCallback(async () => {
  // Only make a move if it's the computer's turn
  if (
    gameMode !== "computer" ||
    game.isGameOver() ||
    game.turn() !== computerColor
  ) {
    return;
  }

  setIsThinking(true);

  try {
    // Add a small delay to simulate "thinking"
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get move from Stockfish
    const move = await stockfish.makeMove(game, {
      depth: difficulty,
      skill: difficulty,
    });

    if (move) {
      // Check for captures
      if (move.captured) {
        const capturedPiece = {
          type: move.captured,
          color: move.color === "w" ? "b" : "w",
        };
        setCapturedPieces((prev) => ({
          ...prev,
          [move.color]: [...prev[move.color], capturedPiece],
        }));
      }

      // Update game status
      updateGameStatus();
    }
  } catch (error) {
    console.error("Error getting computer move:", error);
  } finally {
    setIsThinking(false);
  }
}, [game, gameMode, computerColor, difficulty, stockfish, updateGameStatus]);
```

## Step 4: Trigger Computer Move After Human Move

Add an effect to trigger the computer move after a human move:

```tsx
// Trigger computer move when it's the computer's turn
useEffect(() => {
  if (gameMode === "computer" && game.turn() === computerColor) {
    const timer = setTimeout(() => {
      getComputerMove();
    }, 500); // Add slight delay for better UX

    return () => clearTimeout(timer);
  }
}, [fen, gameMode, computerColor, getComputerMove, game]);
```

## Step 5: Add Game Mode UI

Add UI for selecting game mode and difficulty:

```tsx
// Game mode settings UI
const GameSettings = () => (
  <div className="mb-4 p-4 bg-black/30 rounded-lg">
    <h3 className="text-lg font-bold mb-2">Game Settings</h3>
    <div className="flex flex-wrap gap-4 items-center">
      <div>
        <label className="block text-sm mb-1">Game Mode</label>
        <select
          className="bg-gray-800 border border-gray-700 rounded p-2"
          value={gameMode}
          onChange={(e) => {
            setGameMode(e.target.value as "human" | "computer");
            restartGame();
          }}
        >
          <option value="human">Human vs Human</option>
          <option value="computer">Play vs Computer</option>
        </select>
      </div>

      {gameMode === "computer" && (
        <>
          <div>
            <label className="block text-sm mb-1">Play As</label>
            <select
              className="bg-gray-800 border border-gray-700 rounded p-2"
              value={computerColor === "w" ? "b" : "w"}
              onChange={(e) => {
                setComputerColor(e.target.value === "w" ? "b" : "w");
                restartGame();
              }}
            >
              <option value="w">White</option>
              <option value="b">Black</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">
              Difficulty (ELO ~{1100 + difficulty * 95})
            </label>
            <select
              className="bg-gray-800 border border-gray-700 rounded p-2"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            >
              <option value="5">Beginner</option>
              <option value="10">Intermediate</option>
              <option value="15">Advanced</option>
              <option value="20">Master</option>
            </select>
          </div>
        </>
      )}

      <Button
        variant="default"
        className="mt-auto bg-gradient-to-r from-amber-500 to-orange-600"
        onClick={restartGame}
      >
        <RotateCw className="w-4 h-4 mr-2" /> New Game
      </Button>
    </div>
  </div>
);
```

## Step 6: Modify Restart Game function

Update the restart game function to handle computer moves:

```tsx
const restartGame = () => {
  game.reset();
  setSelectedSquare(null);
  setValidMoves([]);
  setCapturedPieces({ w: [], b: [] });
  setCurrentPlayer("w");
  setActiveTimer("w");
  setTimers({ w: 600, b: 600 });
  setFen(game.fen());
  updateGameStatus();

  // Start computer move if playing as black
  if (gameMode === "computer" && computerColor === "w") {
    setTimeout(() => {
      getComputerMove();
    }, 1000);
  }
};
```

## Step 7: Add Thinking Indicator

Add a thinking indicator to show when the computer is calculating:

```tsx
{
  /* Thinking indicator */
}
{
  isThinking && (
    <div className="absolute top-20 left-0 right-0 text-center z-20">
      <div className="px-4 py-1 rounded-full inline-flex items-center gap-2 bg-blue-600/80">
        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        Computer is thinking...
      </div>
    </div>
  );
}
```

## Step 8: Update handleSquareClick

Modify the handleSquareClick function to prevent moving the computer's pieces:

```tsx
const handleSquareClick = (square: string) => {
  try {
    // Return early if game is over or if it's the computer's turn
    if (
      game.isGameOver() ||
      (gameMode === 'computer' && game.turn() === computerColor)
    ) return;

    // Rest of the function remains the same...
```

## Final Notes

1. Make sure the Stockfish backend server is running
2. The computer player will only make moves when it's their turn
3. You can adjust the difficulty level to change the strength of the computer
4. The ELO rating is an estimation based on the skill level
