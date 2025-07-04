import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wallet } from "lucide-react";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export function LandingPage() {
  const navigate = useNavigate();
  const { publicKey, connected } = useWallet();

  // Helper to format the wallet address for display
  const getDisplayAddress = () => {
    if (!publicKey) return "";
    const base58 = publicKey.toBase58();
    return base58.length > 8
      ? `${base58.slice(0, 4)}...${base58.slice(-4)}`
      : base58;
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen text-white p-4 overflow-hidden bg-black">
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/95 z-0"></div>

      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-700/10 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mb-8 md:mb-12"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-3 tracking-tight text-shadow-lg">
            <motion.span
              className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text inline-block"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            >
              Chessol
            </motion.span>
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.8 }}
            className="h-1 w-32 bg-gradient-to-r from-amber-400 to-orange-600 rounded-full mx-auto mb-6 max-w-xs"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-lg md:text-xl text-gray-300 font-light max-w-xl mx-auto"
          >
            Engage in the ultimate battle of wits. Stake your claim on the
            Solana blockchain.
          </motion.p>
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
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg px-10 py-6 rounded-full shadow-lg shadow-amber-900/20 hover:shadow-xl transition-all duration-300 w-full sm:w-auto cursor-pointer"
              onClick={() => {
                if (!publicKey) {
                  toast.error("Please connect your wallet to continue");
                  return;
                }
                navigate("/games");
              }}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Button
              size="lg"
              className="bg-black/40 backdrop-blur-sm text-gray-300 border border-purple-700/50 hover:border-amber-500 hover:text-white hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] font-semibold text-lg px-10 py-6 rounded-full shadow-md transition-all duration-300 w-full sm:w-auto cursor-pointer"
              onClick={() => {
                const walletButton = document.querySelector(
                  ".wallet-adapter-button-trigger"
                );
                if (walletButton instanceof HTMLElement) {
                  walletButton.click();
                }
              }}
            >
              <Wallet className="mr-2 h-5 w-5" />
              {connected && publicKey ? getDisplayAddress() : "Connect Wallet"}
            </Button>
            <div className="hidden">
              <WalletMultiButton />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* disconnect button */}
      <div className="fixed top-3 right-2 z-20">
        {connected && (
          <Button
            className="bg-black/40 backdrop-blur-sm text-gray-300 border border-purple-700/50 hover:border-amber-500 hover:text-white hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] font-semibold text-base px-6 py-6 rounded-full shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => {
              const walletButtons = document.querySelectorAll(
                ".wallet-adapter-button-trigger"
              );
              console.log("walletButton", walletButtons);
              for (const walletButton of walletButtons) {
                if (walletButton instanceof HTMLElement) {
                  walletButton.click();
                }
              }
            }}
          >
            Disconnect Wallet
          </Button>
        )}
        <div className="hidden">
          <WalletDisconnectButton />
        </div>
      </div>

      {/* Optional Subtle Footer */}
      <footer className="absolute bottom-5 text-center w-full text-gray-500 text-xs z-10">
        Powered by Solana | © {new Date().getFullYear()} Chessol
      </footer>
    </div>
  );
}
