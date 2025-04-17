import { Router } from "express";
import { validate } from "../middleware/validation";
import { gameValidationSchema } from "../validation/gameValidation";
import { gameController } from "../controllers/GameController";

const router = Router();

router.get(
  "/get-move",
  validate(gameValidationSchema.getMoveQuery, "query"),
  gameController.getMove
);

router.get("/active-games", gameController.getActiveGames);

export default router;
