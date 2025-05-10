import { FC, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Search, Trophy, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateScore } from "../hooks/useTournamentHooks";
import { ITournament } from "../types";
import { helperUtil } from "@/utils/helper";

interface ScoreManagerProps {
  tournament: ITournament;
  onScoreUpdated: () => void;
}

export const ScoreManager: FC<ScoreManagerProps> = ({
  tournament,
  onScoreUpdated,
}) => {
  const { publicKey } = useWallet();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [scoreChange, setScoreChange] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [searchResults, setSearchResults] = useState<
    Array<{ wallet: string; nickname?: string; score: number }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateScoreMutation = useUpdateScore();
  const isUpdating = updateScoreMutation.isPending;

  // Filter players based on search term
  useEffect(() => {
    if (!tournament.wallets) return;

    if (searchTerm.trim() === "") {
      setSearchResults([]);
      return;
    }

    const results = Object.entries(tournament.wallets)
      .filter(
        ([wallet, player]) =>
          wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (player.nickname &&
            player.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .map(([wallet, player]) => ({
        wallet,
        nickname: player.nickname,
        score: tournament.scoring?.[wallet] ?? tournament.starterScore ?? 0,
      }));

    setSearchResults(results);
  }, [
    searchTerm,
    tournament.wallets,
    tournament.scoring,
    tournament.starterScore,
  ]);

  const handleSelectPlayer = (wallet: string, score: number) => {
    setSelectedWallet(wallet);
    setCurrentScore(score);
    setScoreChange(0);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateScore = () => {
    if (!selectedWallet) {
      setError("No player selected");
      return;
    }

    if (scoreChange === 0) {
      setError("Score change must be non-zero");
      return;
    }

    updateScoreMutation.mutate(
      {
        unique_hash: tournament.unique_hash,
        walletAddress: selectedWallet,
        changeValue: scoreChange,
        creatorWalletAddress: publicKey?.toString(),
      },
      {
        onSuccess: (response) => {
          if (response.status === "success") {
            setSuccess(`Score updated successfully for player`);
            setScoreChange(0);
            onScoreUpdated();
          } else {
            setError(response.msg || "Failed to update score");
          }
        },
        onError: (err) => {
          setError(err.message || "An error occurred while updating score");
        },
      }
    );
  };

  const newExpectedScore = currentScore + scoreChange;

  return (
    <div className="rounded-xl border border-amber-700/30 bg-gradient-to-b from-amber-950/10 to-black/30 backdrop-blur-sm overflow-hidden">
      <div className="border-b border-amber-800/20 bg-black/20 px-6 py-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-400" />
        <h3 className="font-semibold text-amber-300">
          Tournament Score Manager
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Search players */}
        <div className="space-y-2">
          <Label htmlFor="search-players" className="text-sm text-gray-400">
            Search Players (by wallet or nickname)
          </Label>
          <div className="relative">
            <Input
              id="search-players"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter wallet address or nickname..."
              className="pl-10 bg-black/20 border-gray-800 text-gray-200 placeholder:text-gray-500 focus:border-amber-600"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="bg-black/30 rounded-lg border border-gray-800/60 overflow-hidden">
            <div className="text-xs text-gray-500 px-4 py-2 bg-black/20 border-b border-gray-800/60">
              {searchResults.length} player
              {searchResults.length !== 1 ? "s" : ""} found
            </div>
            <div className="max-h-40 overflow-y-auto divide-y divide-gray-800/30">
              {searchResults.map((result) => (
                <div
                  key={result.wallet}
                  className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${
                    selectedWallet === result.wallet
                      ? "bg-amber-900/20 border-l-2 border-amber-500"
                      : "hover:bg-gray-900/40"
                  }`}
                  onClick={() =>
                    handleSelectPlayer(result.wallet, result.score)
                  }
                >
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      {result.nickname || "Unnamed Player"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {helperUtil.shortenWalletAddress(result.wallet)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-900/60 text-amber-400 px-2 py-1 rounded text-xs font-medium">
                      Score: {result.score}
                    </div>
                    {selectedWallet === result.wallet && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score management */}
        {selectedWallet && (
          <div className="space-y-4 border border-gray-800/60 rounded-lg p-4 bg-black/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Selected Player:</div>
                <div className="font-medium text-gray-200">
                  {tournament.wallets?.[selectedWallet]?.nickname ||
                    "Unnamed Player"}
                </div>
                <div className="text-xs text-gray-500">
                  {helperUtil.shortenWalletAddress(selectedWallet)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Current Score:</div>
                <div className="text-lg font-semibold text-amber-400">
                  {currentScore}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800/40">
              <Label htmlFor="score-change" className="text-sm text-gray-400">
                Score Adjustment (+ for increase, - for decrease)
              </Label>
              <div className="flex gap-3 mt-1">
                <Input
                  id="score-change"
                  type="number"
                  value={scoreChange || ""}
                  onChange={(e) => setScoreChange(Number(e.target.value))}
                  className="bg-black/30 border-gray-800 text-gray-200"
                />
                <Button
                  onClick={handleUpdateScore}
                  disabled={isUpdating || scoreChange === 0}
                  className={
                    scoreChange > 0
                      ? "bg-green-700 hover:bg-green-800 text-white min-w-[120px]"
                      : scoreChange < 0
                      ? "bg-red-700 hover:bg-red-800 text-white min-w-[120px]"
                      : "bg-gray-700 text-gray-300 min-w-[120px]"
                  }
                >
                  {isUpdating
                    ? "Updating..."
                    : scoreChange > 0
                    ? `Add +${scoreChange}`
                    : scoreChange < 0
                    ? `Subtract ${scoreChange}`
                    : "Update Score"}
                </Button>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                New Score:{" "}
                <span
                  className={
                    newExpectedScore > currentScore
                      ? "text-green-400 font-medium"
                      : newExpectedScore < currentScore
                      ? "text-red-400 font-medium"
                      : "text-gray-300"
                  }
                >
                  {newExpectedScore}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error/Success messages */}
        {error && (
          <div className="bg-red-900/20 border border-red-800/40 text-red-400 p-3 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-800/40 text-green-400 p-3 rounded-lg flex items-start gap-2">
            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <div className="text-xs text-gray-500 italic mt-4">
          Note: Score changes are immediately applied to the tournament and
          visible to all participants.
        </div>
      </div>
    </div>
  );
};
