import mongoose, { Schema } from "mongoose";
import { IGame, GameStatus, GameResult, GameTimeControl, IMove } from "./types";
import { GAME_CONSTANTS } from "../config/constants";

// Define schema for moves
const MoveSchema: Schema = new Schema<IMove>(
  {
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    promotion: {
      type: String,
      required: false,
    },
    fen: {
      type: String,
      required: true,
    },
    san: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Define the Game schema
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
    moves: [MoveSchema],
    status: {
      type: String,
      enum: Object.values(GameStatus),
      default: GameStatus.WAITING,
    },
    result: {
      type: String,
      enum: Object.values(GameResult),
      default: GameResult.ONGOING,
    },
    timeControl: {
      type: {
        type: String,
        enum: Object.values(GameTimeControl),
        default: GameTimeControl.RAPID,
      },
      initial: {
        type: Number,
        default: GAME_CONSTANTS.DEFAULT_TIME_CONTROL,
      },
      increment: {
        type: Number,
        default: GAME_CONSTANTS.DEFAULT_INCREMENT,
      },
    },
    whiteTimeRemaining: {
      type: Number,
      default: GAME_CONSTANTS.DEFAULT_TIME_CONTROL,
    },
    blackTimeRemaining: {
      type: Number,
      default: GAME_CONSTANTS.DEFAULT_TIME_CONTROL,
    },
    currentPosition: {
      type: String,
      default: GAME_CONSTANTS.DEFAULT_INITIAL_POSITION,
    },
    initialPosition: {
      type: String,
      default: GAME_CONSTANTS.DEFAULT_INITIAL_POSITION,
    },
    aiDifficulty: {
      type: Number,
      min: 1,
      max: 20,
    },
    lastMoveAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    isRated: {
      type: Boolean,
      default: true,
    },
    spectatorCount: {
      type: Number,
      default: 0,
    },
    chatEnabled: {
      type: Boolean,
      default: true,
    },
    pgn: {
      type: String,
      default: "",
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

// Virtual field for game duration in seconds
GameSchema.virtual("duration").get(function (this: IGame) {
  if (!this.completedAt) return null;
  const start = this.createdAt.getTime();
  const end = this.completedAt.getTime();
  return Math.floor((end - start) / 1000);
});

// Virtual field to check if the game is against AI
GameSchema.virtual("isAIGame").get(function (this: IGame) {
  return this.whitePlayer === null || this.blackPlayer === null;
});

// Virtual field to get the winner (if any)
GameSchema.virtual("winner").get(function (this: IGame) {
  if (this.result === GameResult.WHITE_WIN) return this.whitePlayer;
  if (this.result === GameResult.BLACK_WIN) return this.blackPlayer;
  return null;
});

// Calculate move count
GameSchema.virtual("moveCount").get(function (this: IGame) {
  return this.moves.length;
});

const Game = mongoose.model<IGame>("Game", GameSchema);

export default Game;
