import { Document } from "mongoose";

// User-related types
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  profilePicture?: string;
  bio?: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export enum GameResultEnum {
  WHITE_WIN = "white_win",
  BLACK_WIN = "black_win",
  DRAW = "draw",
  ABANDONED = "abandoned",
  ONGOING = "ongoing",
}

export enum GameTimeControl {
  BULLET = "bullet", // 1-2 minutes
  BLITZ = "blitz", // 3-5 minutes
  RAPID = "rapid", // 10-15 minutes
  CLASSICAL = "classical", // 30+ minutes
}

// Game type enum
export enum GameTypeEnum {
  AI_VS_AI = "AI_VS_AI",
  HUMAN_VS_AI = "HUMAN_VS_AI",
  HUMAN_VS_HUMAN = "HUMAN_VS_HUMAN",
}

// Rating change record
export interface IRatingChange extends Document {
  userId: string;
  gameId: string;
  ratingBefore: number;
  ratingAfter: number;
  change: number;
  timestamp: Date;
}

// Tournament-related types (for future use)
export enum TournamentStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface ITournament extends Document {
  name: string;
  description?: string;
  status: TournamentStatus;
  participants: string[]; // Array of User IDs
  games: string[]; // Array of Game IDs
  startDate: Date;
  endDate?: Date;
  rounds: number;
  timeControl: {
    type: GameTimeControl;
    initial: number;
    increment: number;
  };
  winner?: string; // User ID
  prizeFund?: string; // SOL amount for future integration
  createdAt: Date;
  updatedAt: Date;
}

// NFT-related types (for future Solana integration)
export interface IChessNFT extends Document {
  owner: string; // User ID
  mintAddress: string; // Solana mint address
  name: string;
  description?: string;
  imageUrl: string;
  type: "piece" | "board" | "theme";
  rarity: "common" | "uncommon" | "rare" | "legendary" | "unique";
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
