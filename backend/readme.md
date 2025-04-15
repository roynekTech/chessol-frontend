# Chess Stockfish API

A TypeScript Express API that interfaces with the Stockfish chess engine. This API allows you to send a FEN (Forsyth-Edwards Notation) string representing a chess position and receive the best move calculated by Stockfish.

## Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Stockfish chess engine

## Installing Stockfish

### On macOS (including M1/M2 Macs)

Using Homebrew (recommended):

```bash
brew install stockfish
```

### On Windows

1. Download Stockfish from the [official website](https://stockfishchess.org/download/)
2. Extract the executable to a folder, e.g., `backend/bin/stockfish.exe`

### On Linux

```bash
sudo apt-get install stockfish
```

## Setup

1. Clone the repository or navigate to the backend folder
2. Install dependencies:

```bash
cd backend
npm install
```

3. Build the TypeScript code:

```bash
npm run build
```

4. Start the server:

```bash
npm start
```

For development with automatic reloading:

```bash
npm run dev
```

## API Endpoints

### Health Check

```
GET /api/health
```

Response:

```json
{
  "status": "ok",
  "message": "Chess API is running"
}
```

### Get Best Move

```
POST /api/move
```

Request body:

```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "depth": 15,
  "skill": 10
}
```

Parameters:

- `fen` (required): The FEN string representing the position
- `depth` (optional, default: 15): The search depth for Stockfish
- `skill` (optional, default: 10): Skill level (0-20), where 0 is weakest and 20 is strongest

Response:

```json
{
  "bestMove": "e2e4",
  "from": "e2",
  "to": "e4",
  "promotion": null
}
```

## Integration with Frontend

To integrate this API with your React-based chess game:

```typescript
// Example API call from frontend
const getComputerMove = async (fen: string) => {
  try {
    const response = await fetch("http://localhost:3001/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fen,
        depth: 15, // Adjust based on desired strength
        skill: 10, // Adjust based on desired strength
      }),
    });

    const data = await response.json();

    // Apply the move to your chess.js instance
    const move = game.move({
      from: data.from,
      to: data.to,
      promotion: data.promotion,
    });

    return move;
  } catch (error) {
    console.error("Error getting computer move:", error);
    return null;
  }
};
```

## Troubleshooting

### Stockfish Not Found

If you encounter an error about Stockfish not being found:

1. Check that Stockfish is installed correctly
2. Modify the `getStockfishPath` function in `src/server.ts` to point to your Stockfish executable
3. For M1 Macs, ensure Homebrew is installed to the correct location

### Performance Issues

- Reduce the `depth` parameter for faster but potentially weaker moves
- On slower machines, consider using a lower depth (8-12) for reasonable performance

## License

ISC
