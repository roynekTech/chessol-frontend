import mongoose, { Schema } from "mongoose";
import { IUser } from "./types";
import { USER_CONSTANTS } from "../config/constants";
import bcrypt from "bcryptjs";

// Install bcryptjs: npm install bcryptjs @types/bcryptjs

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [
        USER_CONSTANTS.MAX_USERNAME_LENGTH,
        `Username cannot exceed ${USER_CONSTANTS.MAX_USERNAME_LENGTH} characters`,
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [
        USER_CONSTANTS.MIN_PASSWORD_LENGTH,
        `Password must be at least ${USER_CONSTANTS.MIN_PASSWORD_LENGTH} characters`,
      ],
      select: false, // Don't return password by default
    },
    profilePicture: {
      type: String,
      default: "", // Default profile picture URL
    },
    bio: {
      type: String,
      maxlength: [200, "Bio cannot exceed 200 characters"],
      default: "",
    },
    rating: {
      type: Number,
      default: USER_CONSTANTS.DEFAULT_RATING,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    draws: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Create virtual for win percentage
UserSchema.virtual("winPercentage").get(function (this: IUser) {
  if (this.gamesPlayed === 0) return 0;
  return Math.round((this.wins / this.gamesPlayed) * 100);
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
