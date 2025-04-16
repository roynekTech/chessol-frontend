import { Router } from "express";
import GameController from "../controllers/GameController";
import { validate } from "../middleware/validation";
import {
  createGameSchema,
  makeMoveSchema,
  gameStateSchema,
} from "../validation/gameValidation";

const router = Router();

// Game creation routes
router.post("/ai", validate(createGameSchema), GameController.createAiGame);

// Game retrieval routes
router.get("/ai/active", GameController.listActiveAiGames);
router.get(
  "/:gameId",
  validate(gameStateSchema, "params"),
  GameController.getGame
);

// Game interaction routes - for testing only, in production these would use WebSockets
router.post("/:gameId/move", validate(makeMoveSchema), GameController.makeMove);
router.post(
  "/:gameId/ai-move",
  validate(gameStateSchema, "params"),
  GameController.triggerAiMove
);

export default router;
