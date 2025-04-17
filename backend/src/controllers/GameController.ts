import { Request, Response } from "express";
import { apiResponseHelper } from "../utils/apiResponse";
import { stockfishService } from "../services/StockfishService";
import { gameService } from "../services/GameService";
import { GameModel } from "../models/Game";

async function getMove(req: Request, res: Response) {
  try {
    const { fen, depth, skill } = req.query as any;

    const result = await stockfishService.getBestMove(fen, depth, skill);
    return apiResponseHelper.sendSuccess(res, result);
  } catch (error) {
    return apiResponseHelper.sendError(res, error);
  }
}

async function getActiveGames(req: Request, res: Response) {
  try {
    const result = await gameService.getActiveGames();
    return apiResponseHelper.sendSuccess(res, result);
  } catch (error) {
    return apiResponseHelper.sendError(res, error);
  }
}

async function getGameById(req: Request, res: Response) {
  try {
    const { id } = req.query as any;
    const game = await GameModel.findById(id);
    return apiResponseHelper.sendSuccess(res, game);
  } catch (error) {
    return apiResponseHelper.sendError(res, error);
  }
}

export const gameController = {
  getMove,
  getActiveGames,
  getGameById,
};
