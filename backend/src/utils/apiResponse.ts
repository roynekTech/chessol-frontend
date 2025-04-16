import { Response } from "express";
import { RESPONSE_CODES } from "../config/constants";

interface ErrorDetails {
  message: string;
  code: string;
  details?: any;
}

/**
 * Send a success response
 */
export const sendSuccess = (
  res: Response,
  data: any = null,
  message: string = "Success",
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    status: "success",
    code: RESPONSE_CODES.SUCCESS,
    message,
    data,
  });
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  error: ErrorDetails | string,
  statusCode: number = 400
) => {
  // Convert string error to error object
  const errorObj =
    typeof error === "string"
      ? { message: error, code: RESPONSE_CODES.ERROR }
      : error;

  return res.status(statusCode).json({
    status: "error",
    code: errorObj.code || RESPONSE_CODES.ERROR,
    error: {
      message: errorObj.message,
      details: errorObj.details,
    },
  });
};

/**
 * Send a not found error
 */
export const sendNotFound = (
  res: Response,
  message: string = "Resource not found"
) => {
  return sendError(res, { message, code: RESPONSE_CODES.NOT_FOUND }, 404);
};

/**
 * Send an unauthorized error
 */
export const sendUnauthorized = (
  res: Response,
  message: string = "Unauthorized access"
) => {
  return sendError(res, { message, code: RESPONSE_CODES.UNAUTHORIZED }, 401);
};

/**
 * Send a server error
 */
export const sendServerError = (res: Response, error: any = null) => {
  const message = "Internal server error";
  const details = error instanceof Error ? error.message : error;

  console.error("Server Error:", details);

  return sendError(
    res,
    {
      message,
      code: RESPONSE_CODES.SERVER_ERROR,
      details: process.env.NODE_ENV === "development" ? details : undefined,
    },
    500
  );
};
