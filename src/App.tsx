import { LandingPage } from "./pages/LandingPage";
import { ChessGame } from "./pages/ChessGame";
import { OngoingGames } from "./pages/OngoingGames";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { useMemo } from "react";
import { Lobby } from "./pages/Lobby";
import { WebSocketProvider } from "./context/WebSocketContext";
import HumanVsHuman from "./pages/game-play/HumanVsHuman";
import HumanVsComputer from "./pages/game-play/HumanVsComputer";

const queryClient = new QueryClient();

function App() {
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <WebSocketProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/games" element={<OngoingGames />} />
                  <Route path="/game/:id" element={<ChessGame />} />
                  <Route path="/lobby" element={<Lobby />} />
                  <Route path="/game-play/human" element={<HumanVsHuman />} />
                  <Route
                    path="/game-play/computer"
                    element={<HumanVsComputer />}
                  />
                </Routes>
              </Router>
            </WebSocketProvider>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
