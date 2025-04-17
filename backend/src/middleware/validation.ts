import { Request, Response, NextFunction } from "express";
import Joi from "joi";

type ValidationSource = "body" | "query" | "params";

export const validate = (
  schema: Joi.ObjectSchema,
  source: ValidationSource = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: "",
        },
      },
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);

      return res.status(400).json({
        status: "error",
        error: {
          message: "Validation error",
          details: errorMessages,
        },
      });
    }

    // Replace request data with validated data
    req[source] = value;
    next();
  };
};
