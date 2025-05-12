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
  socials?: Record<string, string>;
  totalPlayers?: number;
  wallets?: Record<string, { nickname?: string }>;
  isBet?: boolean;
  configuration?: {
    creator: string;
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
    win?: number;
    draw?: number;
    loss?: number;
    [wallet: string]: number | undefined;
  };
  winners?: Record<string, string>;
}

export interface ICreateTournamentRequest {
  walletAddress: string;
  name?: string;
  description?: string;
  link?: string;
  socials?: Record<string, string>;
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
    win?: number;
    draw?: number;
    loss?: number;
    [wallet: string]: number | undefined;
  };
  image?: string;
  type?: string;
  level?: number;
  unique_hash?: string;
  date?: string;
  winners?: Record<string, string>;
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
