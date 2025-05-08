import { ArrowRight, Wallet2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export function NewLandingPage() {
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
    <div className="bg-[url('/bg-chess-home.png')] bg-cover min-h-screen max-h-screen bg-blend-normal bg-black/95 overflow-y-hidden">
      {/* nav */}
      <section className="navbar py-8 px-4 flex justify-between items-center">
        <span className="font-bold text-[2rem] bg-[image:var(--theme-orange-gradient)] text-transparent bg-clip-text">
          Chessol
        </span>

        {/* disconnect button */}
        <div>
          {connected && (
            <Button
              className="bg-black/40 backdrop-blur-sm text-[var(--theme-orange)] border border-[var(--theme-orange)]/50 hover:border-[var(--theme-orange)] hover:text-white hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] font-semibold text-base px-6 py-6 rounded-full shadow-md transition-all duration-300 cursor-pointer"
              onClick={() => {
                const walletButtons = document.querySelectorAll(
                  ".wallet-adapter-button-trigger"
                );
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
      </section>

      {/* main content  */}
      <section className="main flex flex-col items-center justify-center min-h-[calc(100vh-15rem)] max-h-screen max-lg:mt-10 px-8 space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-7xl font-bold text-center bg-[image:var(--theme-orange-gradient)] text-transparent bg-clip-text"
        >
          Master the Board,
          <br /> Own the Game
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-md md:text-lg lg:text-xl text-[var(--theme-orange)] text-center mt-3 bg-clip-text text-wrap break-words w-sm lg:w-2xl px-5"
        >
          Play chess, earn rewards, and prove your skills on a decentralized
          battlefield powered by Web3.
        </motion.p>

        {/* action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="flex flex-col md:flex-row gap-4 mt-4 justify-center items-center"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-full md:w-auto"
          >
            <Button
              className={`rounded-[30px] px-10 py-5 cursor-pointer bg-[image:var(--theme-orange-gradient)] hover:bg-transparent w-full md:w-auto`}
              onClick={() => {
                if (!publicKey) {
                  toast.error("Please connect your wallet to continue");
                  return;
                }
                navigate("/games");
              }}
            >
              Get Started
              <ArrowRight />
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Button
              className="rounded-[30px] px-10 py-5 bg-transparent hover:bg-transparent cursor-pointer border border-[var(--theme-orange)]"
              onClick={() => {
                if (connected) {
                  return;
                }
                const walletButtons = document.querySelectorAll(
                  ".wallet-adapter-button-trigger"
                );
                for (const walletButton of walletButtons) {
                  if (walletButton instanceof HTMLElement) {
                    walletButton.click();
                  }
                }
              }}
            >
              <span className="flex items-center justify-center gap-2 text-[var(--theme-orange)]">
                {connected && publicKey
                  ? getDisplayAddress()
                  : "Connect Wallet"}
                <Wallet2 className="" />
              </span>
            </Button>
            <div className="hidden">
              <WalletMultiButton />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          className="relative w-full flex justify-center items-center mt-8"
        >
          <div className="w-full max-w-[280px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px] relative">
            <img
              src="/chess-board.png"
              alt="chess-board"
              className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(245,158,11,0.1)]"
            />
          </div>
        </motion.div>
      </section>
    </div>
  );
}
