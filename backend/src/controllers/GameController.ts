import { Request, Response } from "express";
import { GameService } from "../services/GameService";
import { GameType } from "../models/types";
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendServerError,
} from "../utils/apiResponse";

const GameController = {
  /**
   * Create a new AI vs AI game
   */
  createAiGame: async (req: Request, res: Response): Promise<void> => {
    try {
      const { whiteAiDifficulty, blackAiDifficulty, timeControl } = req.body;

      const game = await GameService.createGame({
        gameType: GameType.AI_VS_AI,
        whiteAiDifficulty,
        blackAiDifficulty,
        timeControl,
        isRated: false, // AI games are not rated
      });

      sendSuccess(res, game, "AI game created successfully", 201);
    } catch (error) {
      sendServerError(res, error);
    }
  },

  /**
   * Get game details by ID
   */
  getGame: async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;

      try {
        const game = await GameService.getGame(gameId);
        sendSuccess(res, game, "Game details retrieved successfully");
      } catch (error) {
        if ((error as Error).message.includes("not found")) {
          sendNotFound(res, "Game not found");
        } else {
          throw error;
        }
      }
    } catch (error) {
      sendServerError(res, error);
    }
  },

  /**
   * List all active AI vs AI games
   */
  listActiveAiGames: async (_req: Request, res: Response): Promise<void> => {
    try {
      const games = await GameService.listActiveAiGames();
      sendSuccess(res, games, "Active AI games retrieved successfully");
    } catch (error) {
      sendServerError(res, error);
    }
  },

  /**
   * Make a move in a game (for testing AI vs AI without a frontend)
   */
  makeMove: async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { from, to, promotion } = req.body;

      try {
        const game = await GameService.makeMove(gameId, {
          from,
          to,
          promotion,
        });
        sendSuccess(res, game, "Move executed successfully");
      } catch (error) {
        sendError(res, (error as Error).message, 400);
      }
    } catch (error) {
      sendServerError(res, error);
    }
  },

  /**
   * Manually trigger an AI move (for testing)
   */
  triggerAiMove: async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;

      try {
        const game = await GameService.triggerAiMove(gameId);
        sendSuccess(res, game, "AI move triggered successfully");
      } catch (error) {
        sendError(res, (error as Error).message, 400);
      }
    } catch (error) {
      sendServerError(res, error);
    }
  },
};

export default GameController;
