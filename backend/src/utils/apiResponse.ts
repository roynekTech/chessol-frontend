import { Response } from "express";

const sendSuccess = (
  res: Response,
  data: any = null,
  message: string = "Success",
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
};

/**
 * Send an error response
 */
const sendError = (
  res: Response,
  error: unknown | null | string,
  statusCode: number = 400
) => {
  console.error("Error in apiResponse.ts:", error);
  let errMsg = error instanceof Error ? error.message : String(error);

  return res.status(statusCode).json({
    status: "error",
    error: null,
    message: errMsg,
  });
};

export const apiResponseHelper = {
  sendSuccess,
  sendError,
};
