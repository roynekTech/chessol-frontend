import { create } from "zustand";
import { IGameState } from "../utils/type";
import { Chess } from "chess.js";

// Helper: Create a fresh initial IGameState
function createInitialGameState(
  fen: string = new Chess().fen(),
  duration: number = 300000 // 5 minutes in ms
): IGameState {
  return {
    fen,
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
  setGameState: (gameState) => set({ gameState }),
  updateGameState: (gameState) =>
    set((state) => ({ gameState: { ...state.gameState, ...gameState } })),
  deleteGameState: () => set({ gameState: createInitialGameState() }),
}));
