import { LandingPage } from "./pages/LandingPage";
import { ChessGame } from "./pages/ChessGame";
import { OngoingGames } from "./pages/OngoingGames";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css"; // Ensure global styles are imported
// Remove reactLogo, viteLogo imports and App.css import if not needed globally

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/games" element={<OngoingGames />} />
        <Route path="/game" element={<ChessGame />} />
      </Routes>
    </Router>
  );
}

export default App;
