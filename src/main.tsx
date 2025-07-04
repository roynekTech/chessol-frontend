import { Buffer } from "buffer";
// Make Buffer available globally
(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "sonner";
import { BreakpointProvider } from "./context/BreakpointContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Toaster />
    <BreakpointProvider>
      <App />
    </BreakpointProvider>
  </StrictMode>
);
