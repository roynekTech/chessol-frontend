import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { User, Bot, Swords, Trophy, Zap, Crown } from "lucide-react";

interface GameModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameModeModal({ open, onOpenChange }: GameModeModalProps) {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState<"human" | "computer">("human");
  const [computerColor, setComputerColor] = useState<"w" | "b">("b");
  const [difficulty, setDifficulty] = useState<number>(10);

  const handleStartGame = () => {
    // Close the modal
    onOpenChange(false);

    // Navigate to the game with query parameters
    navigate(
      `/game?mode=${gameMode}&computerColor=${computerColor}&difficulty=${difficulty}`
    );
  };

  // Define difficulty info
  const difficultyInfo = {
    5: {
      name: "Beginner",
      elo: "~1600",
      icon: <User className="h-5 w-5 text-green-400" />,
    },
    10: {
      name: "Intermediate",
      elo: "~2050",
      icon: <Swords className="h-5 w-5 text-blue-400" />,
    },
    15: {
      name: "Advanced",
      elo: "~2500",
      icon: <Trophy className="h-5 w-5 text-purple-400" />,
    },
    20: {
      name: "Master",
      elo: "~3000",
      icon: <Crown className="h-5 w-5 text-amber-400" />,
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-gray-900 to-black text-white border border-amber-900/20 max-w-md w-full rounded-xl p-0 shadow-xl shadow-amber-900/10 overflow-hidden">
        {/* Background glow effect */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-700/10 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="relative z-10 p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-bold text-center">
              <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 text-transparent bg-clip-text">
                Choose Game Mode
              </span>
              <motion.div
                className="h-1 w-20 bg-gradient-to-r from-amber-400 to-orange-600 rounded-full mx-auto mt-2"
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            {/* Game Mode Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="mb-3 font-medium text-gray-300 flex items-center">
                <Zap className="mr-2 h-4 w-4 text-amber-400" />
                Select Mode
              </h3>
              <RadioGroup
                defaultValue={gameMode}
                onValueChange={(value) =>
                  setGameMode(value as "human" | "computer")
                }
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="human"
                    id="human"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="human"
                    className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-900/30 to-purple-700/10 flex items-center justify-center mb-3 [&:has([data-state=checked])]:from-purple-600/40">
                      <User className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="text-sm font-medium">Human vs Human</div>
                  </Label>
                </div>

                <div>
                  <RadioGroupItem
                    value="computer"
                    id="computer"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="computer"
                    className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 hover:shadow-md hover:shadow-amber-900/10 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-900/30 to-blue-700/10 flex items-center justify-center mb-3 [&:has([data-state=checked])]:from-blue-600/40">
                      <Bot className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="text-sm font-medium">Play vs Computer</div>
                  </Label>
                </div>
              </RadioGroup>
            </motion.div>

            {/* Computer Settings (conditionally shown) */}
            {gameMode === "computer" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Color Selection */}
                <div>
                  <h3 className="mb-3 font-medium text-gray-300 flex items-center">
                    <Zap className="mr-2 h-4 w-4 text-amber-400" />
                    Play As
                  </h3>
                  <RadioGroup
                    defaultValue={computerColor === "w" ? "b" : "w"}
                    onValueChange={(value) =>
                      setComputerColor(value === "w" ? "b" : "w")
                    }
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem
                        value="w"
                        id="white"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="white"
                        className="flex items-center justify-center rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-center bg-white text-black rounded-full w-8 h-8 mr-3 ring-2 ring-gray-700 [&:has([data-state=checked])]:ring-amber-500">
                          ♟
                        </div>
                        <div className="text-sm font-medium">White</div>
                      </Label>
                    </div>

                    <div>
                      <RadioGroupItem
                        value="b"
                        id="black"
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor="black"
                        className="flex items-center justify-center rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-4 hover:bg-gray-800/40 hover:border-amber-700/50 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center justify-center bg-black text-white rounded-full w-8 h-8 mr-3 ring-2 ring-gray-700 border border-gray-600 [&:has([data-state=checked])]:ring-amber-500">
                          ♟
                        </div>
                        <div className="text-sm font-medium">Black</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Difficulty Selection */}
                <div>
                  <h3 className="mb-3 font-medium text-gray-300 flex items-center">
                    <Zap className="mr-2 h-4 w-4 text-amber-400" />
                    Difficulty
                  </h3>
                  <RadioGroup
                    defaultValue={String(difficulty)}
                    onValueChange={(value) => setDifficulty(Number(value))}
                    className="grid grid-cols-2 gap-4"
                  >
                    {Object.entries(difficultyInfo).map(([level, info]) => (
                      <div key={level}>
                        <RadioGroupItem
                          value={level}
                          id={info.name.toLowerCase()}
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor={info.name.toLowerCase()}
                          className="flex flex-col items-center justify-between rounded-xl border border-gray-700 bg-black/40 backdrop-blur-sm p-3 hover:bg-gray-800/40 hover:border-amber-700/50 peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-gradient-to-b [&:has([data-state=checked])]:from-amber-950/30 [&:has([data-state=checked])]:to-black/40 transition-all duration-200 cursor-pointer"
                        >
                          <div className="mb-1">{info.icon}</div>
                          <div className="text-sm font-medium">{info.name}</div>
                          <div className="text-xs text-amber-500/80 font-medium">
                            ELO {info.elo}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 font-semibold py-6 rounded-xl shadow-lg shadow-amber-900/20 transition-all duration-300 transform hover:translate-y-[-2px]"
                onClick={handleStartGame}
              >
                <Swords className="mr-2 h-5 w-5" />
                Start Game
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
