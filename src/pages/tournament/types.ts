export interface ITournament {
  tournmt_id: number;
  name: string;
  description: string;
  type: string;
  level: number;
  unique_hash: string;
  date: string;
  status: "upcoming" | "active" | "completed";
  link?: string;
  isBet?: number;
  configuration?: {
    mode: "bullet" | "blitz" | "rapid" | "classical";
    max_rounds: number;
    randomStart?: boolean;
    moveTimeout?: number;
    numberOfGames?: number;
    resignationTime?: number | null;
    abortTimeout?: number | null;
    paymentAmount?: number;
  };
  starterScore?: number;
}

export interface ICreateTournamentRequest {
  name: string;
  description: string;
  walletAddress: string;
  link?: string;
  configuration?: {
    mode: "bullet" | "blitz" | "rapid" | "classical";
    max_rounds: number;
    randomStart?: boolean;
    moveTimeout?: number;
    numberOfGames?: number;
    resignationTime?: number | null;
    abortTimeout?: number | null;
  };
  isBet?: boolean;
  paymentAmount?: number;
  starterScore?: number;
}

export interface IJoinTournamentRequest {
  unique_hash: string;
  walletAddress: string;
  email?: string;
  contact?: string;
  nickname?: string;
  transactionSignature?: string;
  paymentAmount?: number;
}

export interface IUpdateScoreRequest {
  unique_hash: string;
  walletAddress: string;
  creatorWalletAddress?: string;
  changeValue: number;
}

export interface ITournamentResponse {
  status: "success" | "fail";
  error: boolean;
  msg: string;
  insertId?: number;
  insertHash?: string;
}

export interface ITournamentsListResponse {
  status: boolean;
  error: null | string;
  msg: string;
  tournaments: ITournament[];
}

export interface ITournamentDetailsResponse {
  status: boolean;
  error: null | string;
  msg: string;
  tournament: ITournament;
}
