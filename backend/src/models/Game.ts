import mongoose, { Schema, Document } from "mongoose";
import { GameResultEnum, GameTypeEnum } from "./types";
import { GAME_CONSTANTS } from "../config/constants";
import { DateTime } from "luxon";

export interface IMove {
  from: string;
  to: string;
  promotion?: string;
  fen: string;
  san: string;
  timestamp: Date;
}

export enum GameStatusEnum {
  WAITING = "waiting",
  ACTIVE = "active",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
  DRAW = "draw",
}

export interface IGame extends Document {
  whitePlayer: string | null; // User ID or null for AI
  blackPlayer: string | null; // User ID or null for AI
  whitePlayerUsername: string;
  blackPlayerUsername: string;
  currentTurn: "w" | "b";
  moves: IMove[];
  status: GameStatusEnum;
  result: GameResultEnum;
  currentPosition: string; // FEN
  initialPosition: string; // FEN
  difficulty?: string; // Added to match schema
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  spectatorCount: number;
  gameType: GameTypeEnum; // Type of game (AI vs AI, Human vs AI, etc.)
  startTime: Date;
  endTime: Date;

  // virtual fields (readonly)
  readonly duration?: number | null;
  readonly isAIGame?: boolean;
  readonly winner?: string | null;
  readonly moveCount?: number;
}

export enum GameDifficultyEnum {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

const GameSchema: Schema = new Schema<IGame>(
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
    whitePlayerUsername: String,
    blackPlayerUsername: String,
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
    difficulty: {
      type: String,
      enum: Object.values(GameDifficultyEnum),
      default: GameDifficultyEnum.EASY,
    },
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
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
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
  const start = DateTime.fromJSDate(this.createdAt);
  const end = DateTime.fromJSDate(this.completedAt);
  return Math.floor(end.diff(start, "seconds").seconds);
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

export const GameModel = mongoose.model<IGame>("Game", GameSchema);
