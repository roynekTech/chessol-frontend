import { LandingPage } from "./pages/LandingPage";
import { ChessGame } from "./pages/ChessGame";
import { OngoingGames } from "./pages/OngoingGames";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/games" element={<OngoingGames />} />
          <Route path="/game" element={<ChessGame />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
