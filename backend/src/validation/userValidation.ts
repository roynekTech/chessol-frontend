import Joi from "joi";
import { USER_CONSTANTS } from "../config/constants";

// User registration validation
export const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(USER_CONSTANTS.MAX_USERNAME_LENGTH)
    .required()
    .trim()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .message(
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),

  email: Joi.string().email().required().trim().lowercase(),

  password: Joi.string()
    .min(USER_CONSTANTS.MIN_PASSWORD_LENGTH)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
});

// User login validation
export const loginSchema = Joi.object({
  email: Joi.string().email().required().trim().lowercase(),

  password: Joi.string().required(),
});

// User profile update validation
export const updateProfileSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(USER_CONSTANTS.MAX_USERNAME_LENGTH)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .message(
      "Username can only contain letters, numbers, underscores, and hyphens"
    ),

  email: Joi.string().email().trim().lowercase(),

  bio: Joi.string().max(200),

  profilePicture: Joi.string().uri().allow(""),
});

// Password change validation
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),

  newPassword: Joi.string()
    .min(USER_CONSTANTS.MIN_PASSWORD_LENGTH)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .invalid(Joi.ref("currentPassword"))
    .messages({
      "any.invalid": "New password cannot be the same as current password",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Passwords do not match",
    }),
});
