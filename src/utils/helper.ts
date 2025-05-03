import { Chess, Color, PieceSymbol } from "chess.js";
import { GameStateEnum } from "./type";

export const helperUtil = {
  // Format time from seconds to MM:SS
  formatTime: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  },

  getPieceImageUrl: (piece: { type: PieceSymbol; color: Color }): string => {
    const pieceImages: Record<string, string> = {
      wp: "https://www.chess.com/chess-themes/pieces/neo/150/wp.png",
      wn: "https://www.chess.com/chess-themes/pieces/neo/150/wn.png",
      wb: "https://www.chess.com/chess-themes/pieces/neo/150/wb.png",
      wr: "https://www.chess.com/chess-themes/pieces/neo/150/wr.png",
      wq: "https://www.chess.com/chess-themes/pieces/neo/150/wq.png",
      wk: "https://www.chess.com/chess-themes/pieces/neo/150/wk.png",
      bp: "https://www.chess.com/chess-themes/pieces/neo/150/bp.png",
      bn: "https://www.chess.com/chess-themes/pieces/neo/150/bn.png",
      bb: "https://www.chess.com/chess-themes/pieces/neo/150/bb.png",
      br: "https://www.chess.com/chess-themes/pieces/neo/150/br.png",
      bq: "https://www.chess.com/chess-themes/pieces/neo/150/bq.png",
      bk: "https://www.chess.com/chess-themes/pieces/neo/150/bk.png",
    };
    return pieceImages[`${piece.color}${piece.type}`] || "";
  },

  didCaptureOccur: (prevFen: string, newFen: string): boolean => {
    const prevChess = new Chess(prevFen);
    const newChess = new Chess(newFen);

    // Count pieces for both sides
    const countPieces = (board: ReturnType<typeof prevChess.board>) => {
      const counts: Record<Color, number> = { w: 0, b: 0 };
      board.forEach((row) =>
        row.forEach((piece) => {
          if (piece) counts[piece.color]++;
        })
      );
      return counts;
    };

    const prevCounts = countPieces(prevChess.board());
    const newCounts = countPieces(newChess.board());

    // If either side's piece count decreased, a capture occurred
    return newCounts.w < prevCounts.w || newCounts.b < prevCounts.b;
  },

  shortenWalletAddress: (walletAddress: string): string => {
    return walletAddress.slice(0, 4) + "..." + walletAddress.slice(-4);
  },

  checkGameEnded: (gameStatus: string) => {
    if (
      [
        GameStateEnum.Draw,
        GameStateEnum.Completed,
        GameStateEnum.Abandoned,
      ].includes(gameStatus as GameStateEnum)
    ) {
      return true;
    }

    return false;
  },
};
