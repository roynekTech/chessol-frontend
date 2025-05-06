import { Color, Square } from "chess.js";
import { ICapturedPiece } from "./chessUtils";

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
  StateGame = "stateGame",
  GameState = "gameState",
  Checkmate = "checkmate",
  Draw = "draw",
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
  config?: IGameConfig;
}

export interface IWSCreatedMessage {
  type: WebSocketMessageTypeEnum.Created;
  gameId: string;
  fen: string;
  color: SideEnum | string;
  isBetting: boolean;
  playerAmount: number | null;
  nonce: string;
  duration: number;
  config?: IGameConfig;
}

export interface IWSErrorMessage {
  type: WebSocketMessageTypeEnum.Error;
  message: string;
}

// Consider a union type for easier handling in the component
export type IWSMessage = IWSCreatedMessage | IWSErrorMessage; // Example union type

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
  duration: number;
  config?: IGameConfig;
}

// 3. Make Move
export interface IWSMoveMessage {
  type: WebSocketMessageTypeEnum.Move;
  gameId: string;
  fen: string;
  walletAddress: string;
  move: string;
  clientTime?: number;
  initialFen: string;
}

export interface IWSMoveBroadcast {
  type: WebSocketMessageTypeEnum.Move;
  fen: string;
  turn: SideEnum | string;
  valid: boolean;
  lastMove: IMove | string; // can be object or empty string
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
  sender: string;
  message: string;
  initiator?: string;
}

// 7. Reconnect
export interface IWSReconnectMessage {
  type: WebSocketMessageTypeEnum.Reconnect;
  gameId: string;
  walletAddress: string;
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
  walletAddress: string;
}

export interface IWSGameEndedMessage {
  type: WebSocketMessageTypeEnum.GameEnded;
  winnerColor: "w" | "b" | null;
  reason: string;
  winner: string; // winner wallet address
  fen?: string;
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
  status: string; // e.g. 'searching'
  message: string;
}

// --- Error ---
export interface IWSGenericError {
  type: WebSocketMessageTypeEnum.Error;
  message: string;
}

export interface IGameConfig {
  randomStart?: boolean;
  moveTimeout?: number;
  numberOfGames?: number;
  resignationTime?: number | null;
  abortTimeout?: number | null;
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
  | IWSGameStateMessage
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
  | IWSPairRequestMessage
  | IWSStateGameMessage
  | IWSCheckmateMessage
  | IWSDrawMessage;

// ---- Localstorage items ----
export enum LocalStorageKeysEnum {
  GameDetails = "gameDetails",
  GameState = "gameState",
}

export enum LocalStorageRoomTypeEnum {
  PLAYER = "player",
  SPECTATOR = "spectator",
}
export enum OpponentTypeEnum {
  Human = "human",
  Computer = "computer",
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

export interface IGetGameDataMemResponse {
  state: boolean;
  duration: number;
  game_state: string;
  bet_status: boolean;
  amount: number;
}

export interface IListGamesResponse {
  player1: string;
  player2: string;
  bet_status: number;
  player_amount: string;
  duration: number;
  current_fen: string;
  time_difference: number | null;
  game_hash: string;
  game_state: string;
  spectator_count: number;
}

// 10. State Game
export interface IWSStateGameMessage {
  type: WebSocketMessageTypeEnum.StateGame;
  gameId: string;
}

export interface IWSGameStateMessage {
  type: WebSocketMessageTypeEnum.GameState;
  game: Record<string, unknown>; // TODO: Replace with IGameState when structure is finalized
}

// 11. Checkmate
export interface IWSCheckmateMessage {
  type: WebSocketMessageTypeEnum.Checkmate;
  gameId: string;
  walletAddress: string;
}

// 12. Draw (Stalemate)
export interface IWSDrawMessage {
  type: WebSocketMessageTypeEnum.Draw;
  gameId: string;
  walletAddress: string;
}

// state interface for the game
export interface IGameState {
  roomType: LocalStorageRoomTypeEnum;
  opponentType: OpponentTypeEnum;
  gameId: string;
  isBetting: boolean;
  duration: number;
  playerWalletAddress: string;
  isJoined: boolean;
  fen: string;
  playerColor: Color;
  playerTurn: Color;
  selectedSquare: Square | null;
  validMoves: Square[];
  moveHistory: string[];
  capturedPieces: {
    w: ICapturedPiece[];
    b: ICapturedPiece[];
  };
  lastMove: { from: Square; to: Square } | null;
  winner: Color | "draw" | null;
  isEnded: boolean;
  isOngoing: boolean;
  isStarted: boolean;
  gameStatus: string;
  moveHighlight: { from: Square; to: Square } | null;
  whitePlayerTimerInMilliseconds: number;
  blackPlayerTimerInMilliseconds: number;
  /**
   * Wallet address for the white player (if available)
   */
  player1Wallet?: string;
  /**
   * Wallet address for the black player (if available)
   */
  player2Wallet?: string;
}
