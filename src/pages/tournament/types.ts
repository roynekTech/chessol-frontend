export interface ITournament {
  tournmt_id: number;
  name: string;
  type: string;
  level: number;
  unique_hash: string;
  date: string;
  image: string;
  description: string;
  status: "upcoming" | "active" | "completed";
  link?: string;
  socals?: string;
  totalPlayers?: number;
  wallets?: Record<string, { nickname?: string }>;
  isBet?: number;
  configuration?: {
    mode: string;
    max_rounds: number;
    moveTimeout?: number;
    randomStart?: boolean;
    numberOfGames?: number;
    resignationTime?: null | number;
    abortTimeout?: null | number;
  };
  paymentAmount?: number;
  starterScore?: number;
  scoring?: {
    win: number;
    draw: number;
    loss: number;
    [key: string]: number;
  };
}

export interface ICreateTournamentRequest {
  walletAddress: string;
  name?: string;
  description?: string;
  link?: string;
  socals?: string;
  totalPlayers?: number;
  isBet?: boolean;
  configuration?: {
    mode: string;
    max_rounds: number;
    moveTimeout?: number;
    randomStart?: boolean;
    numberOfGames?: number;
    resignationTime?: null | number;
    abortTimeout?: null | number;
  };
  paymentAmount?: number;
  starterScore?: number;
  scoring?: {
    win: number;
    draw: number;
    loss: number;
  };
  image?: string;
  type?: string;
  level?: number;
  unique_hash?: string;
  date?: string;
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
