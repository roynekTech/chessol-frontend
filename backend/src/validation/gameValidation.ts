import Joi from "joi";

const getMoveQuery = Joi.object({
  fen: Joi.string().required(),
  depth: Joi.number().required(),
  skill: Joi.number().required(),
});

const getGameByIdQuery = Joi.object({
  id: Joi.string().required(),
});

export const gameValidationSchema = {
  getMoveQuery,
  getGameByIdQuery,
};
