import { Color, PieceSymbol } from "chess.js";

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
};
