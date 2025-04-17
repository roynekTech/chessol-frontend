import { Request, Response } from "express";
import { apiResponseHelper } from "../utils/apiResponse";
import { stockfishService } from "../services/StockfishService";

async function getMove(req: Request, res: Response) {
  try {
    const { fen, depth, skill } = req.query as any;

    const result = await stockfishService.getBestMove(fen, depth, skill);
    return apiResponseHelper.sendSuccess(res, result);
  } catch (error) {
    return apiResponseHelper.sendError(res, error);
  }
}

export const gameController = {
  getMove,
};
