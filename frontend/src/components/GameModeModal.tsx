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
import { User, Bot, ChevronRight } from "lucide-react";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 text-white border border-gray-700 max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Choose Game Mode
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Game Mode Selection */}
          <div>
            <h3 className="mb-3 font-semibold">Select Mode</h3>
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
                  className="flex flex-col items-center justify-between rounded-md border-2 border-gray-700 bg-gray-800 p-4 hover:bg-gray-700 hover:border-purple-600 peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-950/20 cursor-pointer"
                >
                  <User className="mb-2 h-6 w-6" />
                  <div className="text-sm">Human vs Human</div>
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
                  className="flex flex-col items-center justify-between rounded-md border-2 border-gray-700 bg-gray-800 p-4 hover:bg-gray-700 hover:border-purple-600 peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-950/20 cursor-pointer"
                >
                  <Bot className="mb-2 h-6 w-6" />
                  <div className="text-sm">Play vs Computer</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Computer Settings (conditionally shown) */}
          {gameMode === "computer" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Color Selection */}
              <div>
                <h3 className="mb-3 font-semibold">Play As</h3>
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
                      className="flex items-center justify-center rounded-md border-2 border-gray-700 bg-gray-800 p-4 hover:bg-gray-700 hover:border-purple-600 peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-950/20 cursor-pointer"
                    >
                      <div className="flex items-center justify-center bg-white text-black rounded-full w-6 h-6 mr-2">
                        ♟
                      </div>
                      <div className="text-sm">White</div>
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
                      className="flex items-center justify-center rounded-md border-2 border-gray-700 bg-gray-800 p-4 hover:bg-gray-700 hover:border-purple-600 peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-950/20 cursor-pointer"
                    >
                      <div className="flex items-center justify-center bg-black text-white rounded-full w-6 h-6 mr-2">
                        ♟
                      </div>
                      <div className="text-sm">Black</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Difficulty Selection */}
              <div>
                <h3 className="mb-3 font-semibold">Difficulty</h3>
                <RadioGroup
                  defaultValue={String(difficulty)}
                  onValueChange={(value) => setDifficulty(Number(value))}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="5"
                      id="beginner"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="beginner"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-gray-700 bg-gray-800 p-3 hover:bg-gray-700 hover:border-purple-600 peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-950/20 cursor-pointer"
                    >
                      <div className="text-sm">Beginner</div>
                      <div className="text-xs text-gray-400">ELO ~1600</div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="10"
                      id="intermediate"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="intermediate"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-gray-700 bg-gray-800 p-3 hover:bg-gray-700 hover:border-purple-600 peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-950/20 cursor-pointer"
                    >
                      <div className="text-sm">Intermediate</div>
                      <div className="text-xs text-gray-400">ELO ~2050</div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="15"
                      id="advanced"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="advanced"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-gray-700 bg-gray-800 p-3 hover:bg-gray-700 hover:border-purple-600 peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-950/20 cursor-pointer"
                    >
                      <div className="text-sm">Advanced</div>
                      <div className="text-xs text-gray-400">ELO ~2500</div>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="20"
                      id="master"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="master"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-gray-700 bg-gray-800 p-3 hover:bg-gray-700 hover:border-purple-600 peer-data-[state=checked]:border-purple-600 [&:has([data-state=checked])]:border-purple-600 [&:has([data-state=checked])]:bg-purple-950/20 cursor-pointer"
                    >
                      <div className="text-sm">Master</div>
                      <div className="text-xs text-gray-400">ELO ~3000</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 font-semibold"
            onClick={handleStartGame}
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Start Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
