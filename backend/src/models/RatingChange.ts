import mongoose, { Schema } from "mongoose";
import { IRatingChange } from "./types";

const RatingChangeSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  gameId: {
    type: Schema.Types.ObjectId,
    ref: "Game",
    required: true,
  },
  ratingBefore: {
    type: Number,
    required: true,
  },
  ratingAfter: {
    type: Number,
    required: true,
  },
  change: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient querying
RatingChangeSchema.index({ userId: 1 });
RatingChangeSchema.index({ gameId: 1 });
RatingChangeSchema.index({ timestamp: -1 });

const RatingChange = mongoose.model<IRatingChange>(
  "RatingChange",
  RatingChangeSchema
);

export default RatingChange;
