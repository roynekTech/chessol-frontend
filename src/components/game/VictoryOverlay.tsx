import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Star, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { PAGE_ROUTES } from "@/utils/constants";

interface VictoryOverlayProps {
  isVisible: boolean;
  winner: "w" | "b" | "draw" | null;
  playerColor: "w" | "b" | null;
  gameStatus: string;
}

export function VictoryOverlay({
  isVisible,
  winner,
  playerColor,
  gameStatus,
}: VictoryOverlayProps) {
  const navigate = useNavigate();
  const isWinner = winner === playerColor;
  const isDraw = winner === "draw";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className="relative w-full max-w-md mx-4 bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl border border-amber-600/30"
          >
            {/* Animated background effects */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="absolute inset-0 overflow-hidden"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.random() * 400 - 200,
                    y: Math.random() * 400 - 200,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                  className="absolute"
                >
                  <Star
                    className={`w-3 h-3 ${
                      isWinner
                        ? "text-yellow-400"
                        : isDraw
                        ? "text-blue-400"
                        : "text-red-400"
                    }`}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Content */}
            <div className="relative px-6 py-8 text-center">
              {/* Trophy Icon with Animation */}
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="flex justify-center mb-6"
              >
                {isDraw ? (
                  <PartyPopper className="w-16 h-16 text-blue-400" />
                ) : isWinner ? (
                  <Trophy className="w-16 h-16 text-yellow-400" />
                ) : (
                  <Crown className="w-16 h-16 text-red-400" />
                )}
              </motion.div>

              {/* Result Text */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold mb-2"
              >
                <span
                  className={`bg-clip-text text-transparent bg-gradient-to-r ${
                    isDraw
                      ? "from-blue-400 to-purple-400"
                      : isWinner
                      ? "from-yellow-400 to-amber-500"
                      : "from-red-400 to-pink-500"
                  }`}
                >
                  {isDraw
                    ? "Game Drawn!"
                    : isWinner
                    ? "Victory!"
                    : "Better luck next time!"}
                </span>
              </motion.h2>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-300 mb-8"
              >
                {gameStatus}
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Button
                  onClick={() => navigate(PAGE_ROUTES.OngoingGames)}
                  className="w-full bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-semibold py-6 rounded-full shadow-lg transition-all duration-300 transform hover:scale-[1.02] cursor-pointer"
                >
                  Return to Games
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full bg-white/10 text-white hover:text-white hover:bg-white/20 border-0 rounded-full py-6 cursor-pointer"
                >
                  Back to Home
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
