import { FC, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ITournament } from "../types";
import { useJoinTournament } from "../hooks/useTournamentHooks";
import {
  Trophy,
  User,
  Mail,
  Phone,
  DollarSign,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ESCROW_ADDRESS } from "../../../utils/constants";

interface JoinTournamentModalProps {
  tournament: ITournament;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JoinTournamentModal: FC<JoinTournamentModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { publicKey, signMessage, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [transactionSignature, setTransactionSignature] = useState("");
  const [hasSigned, setHasSigned] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use join tournament mutation
  const { mutate: joinTournament, isPending: loading } = useJoinTournament();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;
    try {
      setError(null);
      const joinData = {
        unique_hash: tournament.unique_hash,
        walletAddress: publicKey.toString(),
        nickname: nickname || undefined,
        email: email || undefined,
        contact: contact || undefined,
        transactionSignature: transactionSignature || undefined,
        paymentAmount:
          tournament.isBet === 1
            ? tournament.configuration?.paymentAmount
            : undefined,
      };
      joinTournament(joinData, {
        onSuccess: (response) => {
          if (response.status === "success") {
            onSuccess();
          } else {
            setError(response.msg || "Failed to join tournament");
          }
        },
        onError: (err) => {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
        },
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  // Handler for wallet signing (non-bet tournaments)
  const handleWalletSign = async () => {
    if (!publicKey || !signMessage) {
      setError("Wallet not connected or signing not supported.");
      return;
    }
    setSigning(true);
    setError(null);
    try {
      const message = new TextEncoder().encode(
        `Join tournament: ${tournament.unique_hash}`
      );
      const signature = await signMessage(message);
      setTransactionSignature(Buffer.from(signature).toString("base64"));
      setHasSigned(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Signing cancelled or failed."
      );
    } finally {
      setSigning(false);
    }
  };

  // Handler for bet transaction (bet tournaments)
  const handleBetTransaction = async () => {
    if (!publicKey || !sendTransaction || !connection) {
      setError("Wallet or connection not available.");
      return;
    }
    setSigning(true);
    setError(null);
    try {
      const escrowPubkey = new PublicKey(ESCROW_ADDRESS);
      const lamports = Math.floor(
        Number(tournament.configuration?.paymentAmount || 0) * LAMPORTS_PER_SOL
      );
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: escrowPubkey,
          lamports,
        })
      );
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setTransactionSignature(signature);
      setHasSigned(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-gray-800/70 bg-gray-950 shadow-xl  overflow-hidden rounded-xl z-[100] fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-transparent pointer-events-none"></div>

        <DialogHeader className="relative border-b border-gray-800/50 pb-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 rounded-full filter blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-800/5 rounded-full filter blur-2xl pointer-events-none"></div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-700/30 to-black/30 flex items-center justify-center border border-amber-800/50">
                <Trophy className="h-4 w-4 text-amber-400" />
              </div>
              <DialogTitle className="text-xl">
                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
                  Join Tournament
                </span>
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-400">
              {hasSigned
                ? `Enter your details to join "${tournament.name}"`
                : tournament.isBet === 1
                ? `Sign and pay entry fee to join "${tournament.name}"`
                : `Sign with your wallet to join "${tournament.name}"`}
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        {/* Step 1: Wallet sign/transaction */}
        {!hasSigned && (
          <div className="flex flex-col items-center justify-center py-8">
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 text-red-400 text-sm p-3 bg-red-950/20 rounded-lg border border-red-700/30 mb-4"
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
            <Button
              type="button"
              onClick={
                tournament.isBet === 1 ? handleBetTransaction : handleWalletSign
              }
              disabled={signing || !publicKey}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg shadow-amber-900/20 font-medium transform hover:scale-105 px-8 py-3 text-lg"
              aria-busy={signing}
            >
              {signing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {tournament.isBet === 1
                      ? "Processing Payment..."
                      : "Signing..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>
                    {tournament.isBet === 1
                      ? `Pay & Sign to Join`
                      : `Sign to Join`}
                  </span>
                </div>
              )}
            </Button>
            {tournament.isBet === 1 && (
              <p className="mt-4 text-xs text-amber-500/70 flex items-center gap-1.5">
                <DollarSign className="h-3 w-3" />
                Entry fee: {tournament.configuration?.paymentAmount} SOL. You
                will be prompted to approve the transaction.
              </p>
            )}
          </div>
        )}

        {/* Step 2: Show form only after signing/transaction */}
        {hasSigned && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="nickname"
                  className="text-gray-300 flex items-center gap-1.5"
                >
                  <User className="h-3.5 w-3.5 text-purple-400" />
                  Nickname (Optional)
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="How you'll appear to others"
                  className="bg-gray-900 border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-300 flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-blue-400" />
                  Email (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="For tournament notifications"
                  className="bg-gray-900 border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contact"
                  className="text-gray-300 flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5 text-green-400" />
                  Contact (Optional)
                </Label>
                <Input
                  id="contact"
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Phone number or other contact info"
                  className="bg-gray-900 border-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 text-gray-100"
                />
              </div>

              {tournament.isBet === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2 p-3 bg-gray-900 border-l-2 border-amber-500/50 rounded-lg"
                >
                  <Label
                    htmlFor="transaction"
                    className="text-amber-400 flex items-center gap-1.5"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Transaction Signature (Required)
                  </Label>
                  <Input
                    id="transaction"
                    type="text"
                    value={transactionSignature}
                    onChange={(e) => setTransactionSignature(e.target.value)}
                    placeholder="Paste your transaction signature here"
                    required={tournament.isBet === 1}
                    className="bg-gray-900 border-amber-500/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/70 text-amber-100"
                  />
                  <p className="text-xs text-amber-500/70 flex items-center gap-1.5">
                    <DollarSign className="h-3 w-3" />
                    Entry fee: {tournament.configuration?.paymentAmount} SOL.
                    Please complete the payment before submitting.
                  </p>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-3 text-red-400 text-sm p-3 bg-red-950/20 rounded-lg border border-red-700/30"
                >
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </motion.div>

            <DialogFooter className="mt-6 pt-4 border-t border-gray-800/50">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="border-gray-700 bg-black/40 hover:bg-gray-900/60 hover:text-gray-100 transition-all duration-200 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !publicKey}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg shadow-amber-900/20 font-medium transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>Join Tournament</span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
