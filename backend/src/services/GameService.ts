import { Chess } from "chess.js";
import mongoose from "mongoose";
import { Game } from "../models";
import {
  GameStatus,
  GameResult,
  GameTimeControl,
  IGame,
  IMove,
  GameType,
} from "../models/types";
import { GAME_CONSTANTS } from "../config/constants";
import StockfishService from "./ai/StockfishService";

interface CreateGameOptions {
  gameType: GameType;
  timeControl?: {
    type: GameTimeControl;
    initial: number; // Time in seconds
    increment: number; // Increment in seconds
  };
  initialPosition?: string;
  isRated?: boolean;
  whiteAiDifficulty?: number;
  blackAiDifficulty?: number;
  chatEnabled?: boolean;
}

interface MoveOptions {
  from: string;
  to: string;
  promotion?: string;
}

/**
 * Service to handle chess game operations
 */
const GameService = {
  /**
   * Create a new chess game
   */
  createGame: async (options: CreateGameOptions): Promise<IGame> => {
    try {
      // Set default values
      const {
        gameType,
        timeControl = {
          type: GameTimeControl.RAPID,
          initial: GAME_CONSTANTS.DEFAULT_TIME_CONTROL,
          increment: GAME_CONSTANTS.DEFAULT_INCREMENT,
        },
        initialPosition = GAME_CONSTANTS.DEFAULT_INITIAL_POSITION,
        isRated = true,
        whiteAiDifficulty = 10,
        blackAiDifficulty = 10,
        chatEnabled = true,
      } = options;

      // Validate initial position with chess.js
      try {
        new Chess(initialPosition);
      } catch (error) {
        throw new Error(
          `Invalid initial position: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      // Create game with appropriate players based on game type
      const gameData: Partial<IGame> = {
        whitePlayer:
          gameType === GameType.HUMAN_VS_HUMAN ||
          gameType === GameType.HUMAN_VS_AI
            ? null
            : null, // For AI vs AI, both are null
        blackPlayer: gameType === GameType.HUMAN_VS_HUMAN ? null : null, // For AI vs AI or Human vs AI (as black), null
        currentTurn: "w", // White always starts
        moves: [],
        status:
          gameType === GameType.HUMAN_VS_HUMAN
            ? GameStatus.WAITING
            : GameStatus.ACTIVE, // AI games can start immediately
        result: GameResult.ONGOING,
        timeControl,
        whiteTimeRemaining: timeControl.initial,
        blackTimeRemaining: timeControl.initial,
        currentPosition: initialPosition,
        initialPosition,
        isRated,
        spectatorCount: 0,
        chatEnabled,
        pgn: "",
        gameType,
        whiteAiDifficulty:
          gameType === GameType.AI_VS_AI ? whiteAiDifficulty : undefined,
        blackAiDifficulty:
          gameType === GameType.AI_VS_AI ||
          (gameType === GameType.HUMAN_VS_AI &&
            options.whiteAiDifficulty === undefined)
            ? blackAiDifficulty
            : undefined,
      };

      const game = await Game.create(gameData);
      console.log(`Game created with ID: ${String(game._id)}`);

      // For AI vs AI games, trigger the first move from white
      if (gameType === GameType.AI_VS_AI) {
        // We'll trigger the first AI move asynchronously
        setImmediate(async () => {
          try {
            await GameService.triggerAiMove(String(game._id));
          } catch (error) {
            console.error(
              `Failed to trigger first AI move: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        });
      }

      return game;
    } catch (error) {
      console.error(
        `Error creating game: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  /**
   * Get a game by ID
   */
  getGame: async (gameId: string): Promise<IGame> => {
    try {
      const game = await Game.findById(gameId);
      if (!game) {
        throw new Error(`Game not found with ID: ${gameId}`);
      }
      return game;
    } catch (error) {
      console.error(
        `Error getting game: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  /**
   * Process a move in a chess game
   */
  makeMove: async (gameId: string, move: MoveOptions): Promise<IGame> => {
    try {
      // Find the game
      const game = await GameService.getGame(gameId);

      // Check if game is active
      if (game.status !== GameStatus.ACTIVE) {
        throw new Error(`Cannot make move on game with status: ${game.status}`);
      }

      // Create a chess.js instance with the current position
      const chess = new Chess(game.currentPosition);

      // Try to make the move
      const moveResult = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      });

      if (!moveResult) {
        throw new Error("Invalid move");
      }

      // If move is valid, update game state
      const newFen = chess.fen();
      const newMove: IMove = {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        fen: newFen,
        san: moveResult.san,
        timestamp: new Date(),
      };

      // Update time control if applicable (not implementing this for AI games right now)

      // Update game with the new move and position
      game.moves.push(newMove);
      game.currentPosition = newFen;
      game.currentTurn = game.currentTurn === "w" ? "b" : "w";
      game.lastMoveAt = new Date();
      game.pgn = chess.pgn();

      // Check for game over conditions
      if (chess.isGameOver()) {
        if (chess.isCheckmate()) {
          game.result =
            chess.turn() === "w" ? GameResult.BLACK_WIN : GameResult.WHITE_WIN;
        } else {
          game.result = GameResult.DRAW;
        }
        game.status = GameStatus.COMPLETED;
        game.completedAt = new Date();
      }

      await game.save();

      // If the game is still active and the next player is AI, trigger AI move
      if (
        game.status === GameStatus.ACTIVE &&
        (game.gameType === GameType.AI_VS_AI ||
          (game.gameType === GameType.HUMAN_VS_AI &&
            game.currentTurn === "b" &&
            game.blackAiDifficulty) ||
          (game.gameType === GameType.HUMAN_VS_AI &&
            game.currentTurn === "w" &&
            game.whiteAiDifficulty))
      ) {
        // Trigger AI move asynchronously
        setImmediate(async () => {
          try {
            await GameService.triggerAiMove(String(game._id));
          } catch (error) {
            console.error(
              `Failed to trigger AI move: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        });
      }

      return game;
    } catch (error) {
      console.error(
        `Error making move: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  /**
   * Trigger a move from the AI
   */
  triggerAiMove: async (gameId: string): Promise<IGame> => {
    try {
      // Find the game
      const game = await GameService.getGame(gameId);

      // Check if game is active
      if (game.status !== GameStatus.ACTIVE) {
        throw new Error(
          `Cannot trigger AI move on game with status: ${game.status}`
        );
      }

      // Determine AI difficulty based on current turn
      const aiDifficulty =
        game.currentTurn === "w"
          ? game.whiteAiDifficulty
          : game.blackAiDifficulty;

      if (!aiDifficulty) {
        throw new Error(
          `No AI difficulty set for ${
            game.currentTurn === "w" ? "white" : "black"
          }`
        );
      }

      // Get AI move from Stockfish
      const aiMove = await StockfishService.getBestMove(
        game.currentPosition,
        15, // Default depth
        aiDifficulty
      );

      // Apply the AI move
      return await GameService.makeMove(gameId, {
        from: aiMove.from,
        to: aiMove.to,
        promotion: aiMove.promotion,
      });
    } catch (error) {
      console.error(
        `Error triggering AI move: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  /**
   * List active AI vs AI games
   */
  listActiveAiGames: async (): Promise<IGame[]> => {
    try {
      return await Game.find({
        gameType: GameType.AI_VS_AI,
        status: GameStatus.ACTIVE,
      });
    } catch (error) {
      console.error(
        `Error listing AI games: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },

  /**
   * Count active AI vs AI games
   */
  countActiveAiGames: async (): Promise<number> => {
    try {
      return await Game.countDocuments({
        gameType: GameType.AI_VS_AI,
        status: GameStatus.ACTIVE,
      });
    } catch (error) {
      console.error(
        `Error counting AI games: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  },
};

export { GameService };
