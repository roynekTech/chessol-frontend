import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { GameModeModal } from "@/components/GameModeModal";

export function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen text-white p-4 overflow-hidden bg-black"
      style={{
        backgroundImage: `url(/chess-background.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/70 z-0"></div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mb-8 md:mb-12"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-3 tracking-tight text-shadow-lg">
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
              Chessol
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-light max-w-xl mx-auto">
            Engage in the ultimate battle of wits. Stake your claim on the
            Solana blockchain.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg px-10 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
              onClick={() => setIsModalOpen(true)}
            >
              Enter Arena
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Button
              size="lg"
              className="bg-black/30 text-gray-300 border border-purple-700/50 hover:border-purple-500 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] font-semibold text-lg px-10 py-6 rounded-lg shadow-md transition-all duration-300 w-full sm:w-auto"
              onClick={() =>
                console.log("Connect Wallet Clicked (Not Implemented)")
              }
            >
              Connect Wallet
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Optional Subtle Footer */}
      <footer className="absolute bottom-5 text-center w-full text-gray-500 text-xs z-10">
        Powered by Solana | © {new Date().getFullYear()} Chessol
      </footer>

      {/* Simplified modal rendering, no need for AnimatePresence here since Dialog handles its own lifecycle */}
      <GameModeModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
