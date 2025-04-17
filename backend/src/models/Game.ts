import mongoose, { Schema } from "mongoose";
import {
  IGame,
  GameStatusEnum,
  GameResultEnum,
  GameTimeControl,
  IMove,
  GameTypeEnum,
} from "./types";
import { GAME_CONSTANTS } from "../config/constants";

const GameSchema: Schema = new Schema(
  {
    whitePlayer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    blackPlayer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    currentTurn: {
      type: String,
      enum: ["w", "b"],
      default: "w",
    },
    moves: {
      type: [
        {
          from: String,
          to: String,
          fen: String,
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(GameStatusEnum),
      default: GameStatusEnum.WAITING,
    },
    result: {
      type: String,
      enum: Object.values(GameResultEnum),
      default: GameResultEnum.ONGOING,
    },
    currentPosition: {
      type: String,
      default: GAME_CONSTANTS.DEFAULT_INITIAL_POSITION,
    },
    initialPosition: {
      type: String,
      default: GAME_CONSTANTS.DEFAULT_INITIAL_POSITION,
    },
    difficulty: String,
    completedAt: {
      type: Date,
    },
    spectatorCount: {
      type: Number,
      default: 0,
    },
    gameType: {
      type: String,
      enum: Object.values(GameTypeEnum),
      required: true,
      default: GameTypeEnum.HUMAN_VS_HUMAN,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
GameSchema.index({ whitePlayer: 1 });
GameSchema.index({ blackPlayer: 1 });
GameSchema.index({ status: 1 });
GameSchema.index({ createdAt: -1 });
GameSchema.index({ gameType: 1, status: 1 }); // For querying active AI games

// Virtual field for game duration in seconds
GameSchema.virtual("duration").get(function (this: IGame) {
  if (!this.completedAt) return null;
  const start = this.createdAt.getTime();
  const end = this.completedAt.getTime();
  return Math.floor((end - start) / 1000);
});

// Virtual field to check if the game is against AI
GameSchema.virtual("isAIGame").get(function (this: IGame) {
  return (
    this.gameType === GameTypeEnum.AI_VS_AI ||
    this.gameType === GameTypeEnum.HUMAN_VS_AI
  );
});

// Virtual field to get the winner (if any)
GameSchema.virtual("winner").get(function (this: IGame) {
  if (this.result === GameResultEnum.WHITE_WIN) return this.whitePlayer;
  if (this.result === GameResultEnum.BLACK_WIN) return this.blackPlayer;
  return null;
});

// Calculate move count
GameSchema.virtual("moveCount").get(function (this: IGame) {
  return this.moves.length;
});

const Game = mongoose.model<IGame>("Game", GameSchema);

export default Game;
