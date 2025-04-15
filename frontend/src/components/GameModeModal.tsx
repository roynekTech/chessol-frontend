import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { User, Computer } from "lucide-react"; // Icons for modes
import { useNavigate } from "react-router-dom";

interface GameModeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GameModeModal({ open, onOpenChange }: GameModeModalProps) {
  const navigate = useNavigate();

  // Handle mode selection
  const handleModeSelect = (mode: "human" | "computer") => {
    // Close the modal
    onOpenChange(false);

    // Navigate to the game page with the selected mode as a query parameter
    // This can be used later to determine the game mode
    navigate(`/game?mode=${mode}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-gray-900 via-purple-950 to-black border border-purple-700/50 text-white">
        <DialogHeader className="text-center mb-6">
          <DialogTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-500 mb-2">
            Choose Your Arena
          </DialogTitle>
          <DialogDescription className="text-purple-300/80 text-base">
            Select how you want to challenge your opponent.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Human vs Human Option */}
          <motion.div
            whileHover={{
              scale: 1.03,
              boxShadow: "0 0 15px rgba(255, 255, 255, 0.2)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex flex-col items-center p-6 bg-black/30 border border-gray-700 rounded-lg cursor-pointer hover:border-amber-500 transition-colors duration-300"
            onClick={() => handleModeSelect("human")}
          >
            <User className="w-12 h-12 text-amber-400 mb-4" />
            <h3 className="text-xl text-center font-semibold text-white mb-1">
              Human vs Human
            </h3>
            <p className="text-sm text-gray-400 text-center">
              Challenge a friend or foe.
            </p>
          </motion.div>

          {/* Human vs Computer Option */}
          <motion.div
            whileHover={{
              scale: 1.03,
              boxShadow: "0 0 15px rgba(255, 255, 255, 0.2)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex flex-col items-center p-6 bg-black/30 border border-gray-700 rounded-lg cursor-pointer hover:border-purple-500 transition-colors duration-300"
            onClick={() => handleModeSelect("computer")}
          >
            <Computer className="w-12 h-12 text-purple-400 mb-4" />
            <h3 className="text-xl text-center font-semibold text-white mb-1">
              Human vs Computer
            </h3>
            <p className="text-sm text-gray-400 text-center">
              Test your skills against AI.
            </p>
          </motion.div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)} // Close button
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
