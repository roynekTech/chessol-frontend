// Enums for sides, game states, and WebSocket message types
export enum SideEnum {
  White = "w",
  Black = "b",
  Random = "random",
}

export enum GameStateEnum {
  Waiting = "waiting",
  Running = "running",
  Completed = "completed",
  Active = "active",
  Abandoned = "abandoned",
  Draw = "draw",
}

export enum WebSocketMessageTypeEnum {
  Create = "create",
  Created = "created",
  Join = "join",
  Joined = "joined",
  Move = "move",
  ListGames = "listGames",
  GameList = "gameList",
  ViewGame = "viewGame",
  ViewingGame = "viewingGame",
  Chat = "chat",
  Resign = "resign",
  GameEnded = "gameEnded",
  Error = "error",
  Reconnect = "reconnect",
  Reconnected = "reconnected",
  PairRequest = "pairRequest",
  Paired = "paired",
  Pairing = "pairing",
}

// --- Shared Types ---
export interface IMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface IBetDetails {
  playerAmount: number;
  transactionIds: string[];
}

export interface IGameSummary {
  gameId: string;
  status: string;
  players: number;
  viewers: number;
  fen: string;
}

// --- WebSocket Message Interfaces ---

// 1. Create Game
export interface IWSCreateMessage {
  type: WebSocketMessageTypeEnum.Create;
  walletAddress: string;
  side?: SideEnum | string;
  duration?: number;
  isBetting?: boolean;
  transactionId?: string;
  playerAmount?: number;
}

export interface IWSCreatedMessage {
  type: WebSocketMessageTypeEnum.Created;
  gameId: string;
  fen: string;
  color: SideEnum | string;
  isBetting: boolean;
  playerAmount: number | null;
  nonce: string;
}

// 2. Join Game
export interface IWSJoinMessage {
  type: WebSocketMessageTypeEnum.Join;
  gameId: string;
  walletAddress: string;
  transactionId?: string;
  playerAmount?: number;
}

export interface IWSJoinedMessage {
  type: WebSocketMessageTypeEnum.Joined;
  gameId: string;
  fen: string;
  color: SideEnum | string;
  isBetting: boolean;
  betDetails?: IBetDetails;
  nonce: string;
}

// 3. Make Move
export interface IWSMoveMessage {
  type: WebSocketMessageTypeEnum.Move;
  gameId: string;
  fen: string;
  client: string;
  move: IMove;
  initialFen: string;
}

export interface IWSMoveBroadcast {
  type: WebSocketMessageTypeEnum.Move;
  fen: string;
  turn: SideEnum | string;
  valid: boolean;
  lastMove: IMove;
  nonce: string;
}

// 4. List Games
export interface IWSListGamesMessage {
  type: WebSocketMessageTypeEnum.ListGames;
}

export interface IWSGameListMessage {
  type: WebSocketMessageTypeEnum.GameList;
  games: IGameSummary[];
}

// 5. View Game
export interface IWSViewGameMessage {
  type: WebSocketMessageTypeEnum.ViewGame;
  gameId: string;
}

export interface IWSViewingGameMessage {
  type: WebSocketMessageTypeEnum.ViewingGame;
  gameId: string;
  fen: string;
  status: string;
  players: number;
  viewers: number;
}

// 6. Chat
export interface IWSChatMessage {
  type: WebSocketMessageTypeEnum.Chat;
  gameId: string;
  message: string;
  sender: string;
}

export interface IWSChatBroadcast {
  type: WebSocketMessageTypeEnum.Chat;
  from: string;
  message: string;
}

// 7. Reconnect
export interface IWSReconnectMessage {
  type: WebSocketMessageTypeEnum.Reconnect;
  gameId: string;
  playerId: string;
}

export interface IWSReconnectedMessage {
  type: WebSocketMessageTypeEnum.Reconnected;
  fen: string;
  color: SideEnum | string;
  status: string;
}

// 8. Resign
export interface IWSResignMessage {
  type: WebSocketMessageTypeEnum.Resign;
  gameId: string;
  playerId: string;
}

export interface IWSGameEndedMessage {
  type: WebSocketMessageTypeEnum.GameEnded;
  winner?: string;
  reason: string;
}

// 9. Pair Request
export interface IWSPairRequestMessage {
  type: WebSocketMessageTypeEnum.PairRequest;
  side: SideEnum | string;
  isBetting: boolean;
  walletAddress: string;
  playerAmount?: number;
  transactionId?: string;
}

export interface IWSPairedMessage {
  type: WebSocketMessageTypeEnum.Paired;
  gameId: string;
  fen: string;
  color: SideEnum | string;
  isBetting: boolean;
  opponent: "human" | "bot";
}

export interface IWSPairingMessage {
  type: WebSocketMessageTypeEnum.Pairing;
  status: string;
  message: string;
}

// --- Error ---
export interface IWSGenericError {
  type: WebSocketMessageTypeEnum.Error;
  message: string;
}

// --- Unions for all possible messages ---
export type TWebSocketIncoming =
  | IWSCreatedMessage
  | IWSJoinedMessage
  | IWSMoveBroadcast
  | IWSGameListMessage
  | IWSViewingGameMessage
  | IWSChatBroadcast
  | IWSGameEndedMessage
  | IWSReconnectedMessage
  | IWSPairedMessage
  | IWSPairingMessage
  | IWSGenericError;

export type TWebSocketOutgoing =
  | IWSCreateMessage
  | IWSJoinMessage
  | IWSMoveMessage
  | IWSListGamesMessage
  | IWSViewGameMessage
  | IWSChatMessage
  | IWSResignMessage
  | IWSReconnectMessage
  | IWSPairRequestMessage;

// ---- Localstorage items ----
export enum LocalStorageKeysEnum {
  GameDetails = "gameDetails",
}

export interface IGameDetailsLocalStorage {
  gameId: string;
  fen: string;
  isBetting: boolean;
  playerColor?: SideEnum | string;
}

export interface IGetBestMovePayload {
  fen: string;
  game_id: string;
  level: number;
}

export interface IGetBestMoveResponse {
  game_id: string;
  fen: string;
  best_move: string;
}
