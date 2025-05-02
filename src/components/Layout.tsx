// Wrapper layout for the app

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  // check user wallet is connected and user is not on homepage
  const { publicKey } = useWallet();
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!publicKey && window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [publicKey, window.location.pathname]);

  return <>{children}</>;
}
