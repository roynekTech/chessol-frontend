import { useEffect, useRef, useState, useCallback } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import type {
  Event as RwsEvent,
  CloseEvent as RwsCloseEvent,
  ErrorEvent as RwsErrorEvent,
} from "reconnecting-websocket";

export interface WebSocketMessage {
  data: string;
  event: MessageEvent;
}

export interface UseWebSocketOptions {
  /** Called when a message is received */
  onMessage?: (msg: WebSocketMessage) => void;
  /** Called when the socket opens */
  onOpen?: (event: RwsEvent) => void;
  /** Called when the socket closes */
  onClose?: (event: RwsCloseEvent) => void;
  /** Called on error */
  onError?: (event: RwsErrorEvent) => void;
  /** Optional protocols */
  protocols?: string | string[];
  /**
   * Called after a reconnect (open event after a close)
   * Useful for sending a reconnect message or restoring session
   */
  onReconnect?: (ws: ReconnectingWebSocket) => void;
}

const defaultWebsocketUrl =
  import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:3001";

/**
 * React hook for using a WebSocket connection with automatic reconnection.
 * @param url The WebSocket server URL (e.g., ws://localhost:3001)
 * @param options Optional event handlers
 */
export function useWebSocket(
  options: UseWebSocketOptions = {},
  url = defaultWebsocketUrl
) {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<ReconnectingWebSocket | null>(null);

  // Send message function
  const sendMessage = useCallback((msg: string) => {
    console.log("sending message", msg);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    } else {
      console.warn("WebSocket is not open. Message not sent:", msg);
    }
  }, []);

  useEffect(() => {
    const ws = new ReconnectingWebSocket(url, options?.protocols);
    wsRef.current = ws;

    // Track if this is a reconnect (open after close)
    let wasClosed = false;

    // --- Keepalive Ping Interval ---
    // Effect: Sends a {type: "ping"} message every 25 seconds to keep the connection alive
    // Input: None
    // Output: Keeps WebSocket from being closed by server for idleness
    let pingInterval: NodeJS.Timeout | null = null;
    const startPing = () => {
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000); // 30 seconds
    };
    const stopPing = () => {
      if (pingInterval) clearInterval(pingInterval);
      pingInterval = null;
    };

    ws.addEventListener("open", (event: RwsEvent) => {
      startPing();
      // If this is a reconnect (not the first open), call onReconnect
      if (wasClosed && options.onReconnect) {
        options.onReconnect(ws);
      }
      wasClosed = false;
      options.onOpen?.(event);
    });
    ws.addEventListener("close", (event: RwsCloseEvent) => {
      stopPing();
      wasClosed = true;
      options.onClose?.(event);
    });
    ws.addEventListener("error", (event: RwsErrorEvent) => {
      options.onError?.(event);
    });
    ws.addEventListener("message", (event: MessageEvent) => {
      const msg = { data: event.data, event };
      console.log("new message", event.data);
      setLastMessage(msg);
      options.onMessage?.(msg);
    });

    return () => {
      stopPing();
      ws.close();
    };
    // Only re-run if url or protocols change
  }, [url, JSON.stringify(options.protocols)]);

  return { sendMessage, lastMessage, ws: wsRef.current };
}
