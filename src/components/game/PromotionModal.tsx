
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PromotionModalProps {
  isOpen: boolean;
  playerColor: "w" | "b";
  onPieceSelect: (piece: "q" | "r" | "b" | "n") => void;
}

export function PromotionModal({ isOpen, playerColor, onPieceSelect }: PromotionModalProps) {
  // Piece images mapping
  const getPieceImage = (piece: string, color: "w" | "b") => {
    const pieceImages: Record<string, string> = {
      wq: "https://www.chess.com/chess-themes/pieces/neo/150/wq.png",
      wr: "https://www.chess.com/chess-themes/pieces/neo/150/wr.png",
      wb: "https://www.chess.com/chess-themes/pieces/neo/150/wb.png",
      wn: "https://www.chess.com/chess-themes/pieces/neo/150/wn.png",
      bq: "https://www.chess.com/chess-themes/pieces/neo/150/bq.png",
      br: "https://www.chess.com/chess-themes/pieces/neo/150/br.png",
      bb: "https://www.chess.com/chess-themes/pieces/neo/150/bb.png",
      bn: "https://www.chess.com/chess-themes/pieces/neo/150/bn.png",
    };
    return pieceImages[`${color}${piece}`];
  };

  const promotionPieces = [
    { piece: "q" as const, name: "Queen" },
    { piece: "r" as const, name: "Rook" },
    { piece: "b" as const, name: "Bishop" },
    { piece: "n" as const, name: "Knight" },
  ];

  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-white">
            Choose Promotion Piece
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 p-4">
          {promotionPieces.map(({ piece, name }) => (
            <motion.div key={piece} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => onPieceSelect(piece)}
                className="w-full h-24 flex flex-col items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 transition-colors"
                variant="outline"
              >
                <img
                  src={getPieceImage(piece, playerColor)}
                  alt={`${playerColor}${piece}`}
                  className="w-12 h-12 object-contain"
                  draggable={false}
                />
                <span className="text-sm font-medium text-gray-200">{name}</span>
              </Button>
            </motion.div>
          ))}
        </div>
        <div className="text-center text-sm text-gray-400 pb-2">
          Select the piece you want to promote your pawn to
        </div>
      </DialogContent>
    </Dialog>
  );
}
