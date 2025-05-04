import { LandingPage } from "./pages/LandingPage";
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
import HumanVsComputer from "./pages/game-play/HumanVsComputer";
import HumanVsHumanV2 from "./pages/game-play/HumanVsHumanV2";
import { TournamentPage } from "./pages/tournament/TournamentPage";
import { Layout } from "./components/Layout";

const queryClient = new QueryClient();

function App() {
  const nodeEnv = import.meta.env.VITE_NODE_ENV;
  const network =
    nodeEnv === "production"
      ? WalletAdapterNetwork.Mainnet
      : WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <WebSocketProvider>
              <Layout>
                <Router>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/games" element={<OngoingGames />} />
                    <Route path="/lobby" element={<Lobby />} />
                    <Route
                      path="/game-play/human"
                      element={<HumanVsHumanV2 />}
                    />
                    <Route
                      path="/game-play/computer"
                      element={<HumanVsComputer />}
                    />
                    <Route path="/tournaments" element={<TournamentPage />} />
                  </Routes>
                </Router>
              </Layout>
            </WebSocketProvider>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
