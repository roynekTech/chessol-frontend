import { createContext, ReactNode } from "react";
import { useWebSocket, WebSocketMessage } from "../utils/useWebSocket";

// ws can be a WebSocket, ReconnectingWebSocket, or null depending on implementation
interface IWebSocketContext {
  sendMessage: (msg: string) => void;
  lastMessage: WebSocketMessage | null;
  ws: unknown; // Accept any WebSocket-like instance
}

// Create the context
export const WebSocketContext = createContext<IWebSocketContext | undefined>(
  undefined
);

// Provider component
export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  // Use the persistent WebSocket connection
  const { sendMessage, lastMessage, ws } = useWebSocket();

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, ws }}>
      {children}
    </WebSocketContext.Provider>
  );
};
