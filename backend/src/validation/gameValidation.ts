import Joi from "joi";
import { GameTimeControl } from "../models/types";

// Create new game validation
export const createGameSchema = Joi.object({
  timeControl: Joi.object({
    type: Joi.string()
      .valid(...Object.values(GameTimeControl))
      .required(),
    initial: Joi.number()
      .integer()
      .min(30) // Minimum 30 seconds
      .max(3600) // Maximum 1 hour
      .required(),
    increment: Joi.number().integer().min(0).max(60).required(),
  }).required(),

  isRated: Joi.boolean().default(true),

  initialPosition: Joi.string()
    .pattern(
      /^([pnbrqkPNBRQK1-8]+\/){7}[pnbrqkPNBRQK1-8]+\s[wb]\s[KQkq-]{1,4}\s[a-h1-8-]{1,2}\s\d+\s\d+$/
    )
    .message("Invalid FEN string format")
    .default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),

  playAsColor: Joi.string().valid("white", "black", "random").default("random"),

  chatEnabled: Joi.boolean().default(true),

  aiGame: Joi.boolean().default(false),

  aiDifficulty: Joi.when("aiGame", {
    is: true,
    then: Joi.number().integer().min(1).max(20).required().messages({
      "any.required": "AI difficulty is required for AI games",
    }),
    otherwise: Joi.forbidden(),
  }),
});

// Make move validation
export const makeMoveSchema = Joi.object({
  gameId: Joi.string().hex().length(24).required(),

  from: Joi.string()
    .length(2)
    .pattern(/^[a-h][1-8]$/)
    .required()
    .messages({
      "string.pattern.base":
        "Invalid from square. Must be in format e2, a1, etc.",
    }),

  to: Joi.string()
    .length(2)
    .pattern(/^[a-h][1-8]$/)
    .required()
    .messages({
      "string.pattern.base":
        "Invalid to square. Must be in format e4, a3, etc.",
    }),

  promotion: Joi.string().valid("q", "r", "b", "n").optional(),
});

// AI move request validation
export const aiMoveSchema = Joi.object({
  fen: Joi.string()
    .pattern(
      /^([pnbrqkPNBRQK1-8]+\/){7}[pnbrqkPNBRQK1-8]+\s[wb]\s[KQkq-]{1,4}\s[a-h1-8-]{1,2}\s\d+\s\d+$/
    )
    .required()
    .messages({
      "string.pattern.base": "Invalid FEN string format",
    }),

  depth: Joi.number().integer().min(1).max(20).default(15),

  skill: Joi.number().integer().min(1).max(20).default(10),
});

// Game state validation
export const gameStateSchema = Joi.object({
  gameId: Joi.string().hex().length(24).required(),
});

// Resign game validation
export const resignGameSchema = Joi.object({
  gameId: Joi.string().hex().length(24).required(),
});

// Offer/accept draw validation
export const drawActionSchema = Joi.object({
  gameId: Joi.string().hex().length(24).required(),

  action: Joi.string().valid("offer", "accept", "decline").required(),
});
