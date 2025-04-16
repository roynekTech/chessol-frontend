import { Chess, Move } from "chess.js";

interface StockfishMoveResponse {
  bestMove: string;
  from: string;
  to: string;
  promotion?: string;
}

interface StockfishOptions {
  depth?: number;
  skill?: number;
}

/**
 * Service to interact with the Stockfish API
 */
export class StockfishService {
  private apiUrl: string;

  constructor(baseUrl: string = "http://localhost:3001") {
    this.apiUrl = baseUrl;
  }

  /**
   * Get the best move for a given position from Stockfish
   * @param fen The FEN string representing the position
   * @param options Options for Stockfish (depth, skill level)
   * @returns Promise with the move result
   */
  async getBestMove(
    fen: string,
    options: StockfishOptions = {}
  ): Promise<StockfishMoveResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fen,
          depth: options.depth || 15,
          skill: options.skill || 10,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get best move");
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting move from Stockfish:", error);
      throw error;
    }
  }

  /**
   * Apply the Stockfish move to a chess.js instance
   * @param game The chess.js instance
   * @param options Options for Stockfish (depth, skill level)
   * @returns Promise with the move result
   */
  async makeMove(
    game: Chess,
    options: StockfishOptions = {}
  ): Promise<Move | null> {
    try {
      const fen = game.fen();
      console.log("Requesting move for position:", fen);
      const moveData = await this.getBestMove(fen, options);
      console.log("Received move data:", moveData);

      const move = game.move({
        from: moveData.from,
        to: moveData.to,
        promotion: moveData.promotion as "q" | "r" | "b" | "n" | undefined,
      });

      console.log("Applied move:", move);
      return move;
    } catch (error) {
      console.error("Error making Stockfish move:", error);
      return null;
    }
  }

  /**
   * Check if the Stockfish API is running
   * @returns Promise with boolean indicating if the API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      console.log("Checking Stockfish API availability...");
      const response = await fetch(`${this.apiUrl}/api/health`);
      const data = await response.json();
      console.log("Stockfish API health check response:", data);
      return data.status === "ok";
    } catch (error) {
      console.error("Stockfish API is not available:", error);
      return false;
    }
  }
}
