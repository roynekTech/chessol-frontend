import { create } from "zustand";
import { IGameState, LocalStorageKeysEnum } from "../utils/type";
import { Chess } from "chess.js";
import { localStorageHelper } from "../utils/localStorageHelper";

// Helper: Create a fresh initial IGameState
function createInitialGameState(
  fen: string = new Chess().fen(),
  duration: number = 300000 // 5 minutes in ms
): IGameState {
  const savedGameState = localStorageHelper.getItem(
    LocalStorageKeysEnum.GameDetails
  );

  return {
    fen,
    playerColor: "w",
    playerTurn: "w",
    selectedSquare: null,
    validMoves: [],
    moveHistory: [],
    capturedPieces: { w: [], b: [] },
    lastMove: null,
    winner: null,
    gameStatus: "Waiting for opponent...",
    isStarted: true,
    isOngoing: true,
    isEnded: false,
    moveHighlight: null,
    whitePlayerTimerInMilliseconds: duration,
    blackPlayerTimerInMilliseconds: duration,
    ...savedGameState,
  };
}

interface IChessGameStore {
  gameState: IGameState;
  setGameState: (gameState: IGameState) => void;
  updateGameState: (gameState: Partial<IGameState>) => void;
  deleteGameState: () => void;
}

export const useChessGameStore = create<IChessGameStore>((set) => ({
  // Default state: new game, 5 min timers
  gameState: createInitialGameState(),
  setGameState: (gameState) => {
    set({ gameState });
    localStorageHelper.setItem(LocalStorageKeysEnum.GameDetails, gameState);
  },
  updateGameState: (gameState) => {
    set((state) => {
      const newState = { ...state.gameState, ...gameState };
      localStorageHelper.setItem(LocalStorageKeysEnum.GameDetails, newState);
      return { gameState: newState };
    });
  },
  deleteGameState: () => {
    localStorageHelper.deleteItem(LocalStorageKeysEnum.GameDetails);
    set({ gameState: createInitialGameState() });
  },
}));
