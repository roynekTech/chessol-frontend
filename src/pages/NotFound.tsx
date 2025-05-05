import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { PAGE_ROUTES } from "../utils/constants";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950 to-black relative overflow-hidden p-4">
      {/* Animated background glows for brand consistency */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full filter blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-800/10 rounded-full filter blur-3xl pointer-events-none z-0" />

      {/* Centered glassmorphism card with animation */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full bg-black/40 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center"
        aria-label="404 Page Not Found"
      >
        {/* Error Icon */}
        <AlertTriangle
          className="w-16 h-16 text-amber-400 mb-4 drop-shadow-lg"
          aria-hidden="true"
        />
        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
          Page Not Found
        </h1>
        {/* Subtext */}
        <p className="text-gray-400 mb-6 text-base md:text-lg">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        {/* Back to Home Button */}
        <Button
          variant="outline"
          size="lg"
          className="text-amber-400 border-amber-700/30 bg-black/30 hover:bg-amber-900/30 hover:text-amber-300 hover:border-amber-600 transition-all duration-300 rounded-full shadow-sm shadow-amber-900/10 font-semibold px-8 py-4 cursor-pointer"
          onClick={() => navigate(PAGE_ROUTES.Homepage)}
          aria-label="Back to Home"
        >
          <ArrowLeft className="mr-2 h-5 w-5" /> Back to Home
        </Button>
      </motion.div>
    </main>
  );
}
