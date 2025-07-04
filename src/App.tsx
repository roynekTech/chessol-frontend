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
import "@solana/wallet-adapter-react-ui/styles.css";
import { useMemo } from "react";
import { Lobby } from "./pages/Lobby";
import { WebSocketProvider } from "./context/WebSocketContext";
import HumanVsHumanV2 from "./pages/game-play/HumanVsHumanV2";
import { TournamentRouter } from "./pages/tournament/TournamentRouter";
import { Layout } from "./components/Layout";
import { NotFound } from "./pages/NotFound";
import { PAGE_ROUTES } from "./utils/constants";
import { NewLandingPage } from "./pages/LandingPageNew";
import { clusterApiUrl } from "@solana/web3.js";

const queryClient = new QueryClient();

function App() {
  const nodeEnv = import.meta.env.VITE_NODE_ENV;
  const network =
    nodeEnv === "production"
      ? WalletAdapterNetwork.Mainnet
      : WalletAdapterNetwork.Devnet;

  // Custom RPC endpoint configuration
  const endpoint = useMemo(() => {
    const mainnetRpcUrl = import.meta.env.VITE_MAINNET_RPC_URL;

    if (network === WalletAdapterNetwork.Mainnet) {
      return mainnetRpcUrl;
    }

    return clusterApiUrl(network);
  }, [network]);

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
                    <Route path={"/old"} element={<LandingPage />} />
                    <Route
                      path={PAGE_ROUTES.Homepage}
                      element={<NewLandingPage />}
                    />
                    <Route
                      path={PAGE_ROUTES.OngoingGames}
                      element={<OngoingGames />}
                    />
                    <Route path={PAGE_ROUTES.Lobby} element={<Lobby />} />
                    <Route
                      path={PAGE_ROUTES.GamePlay}
                      element={<HumanVsHumanV2 />}
                    />
                    <Route
                      path={`${PAGE_ROUTES.TournamentPage}/*`}
                      element={<TournamentRouter />}
                    />
                    <Route path={PAGE_ROUTES.NotFound} element={<NotFound />} />
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
