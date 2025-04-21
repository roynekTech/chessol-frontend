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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(msg);
    } else {
      console.warn("WebSocket is not open. Message not sent:", msg);
    }
  }, []);

  useEffect(() => {
    const ws = new ReconnectingWebSocket(url, options?.protocols);
    wsRef.current = ws;

    ws.addEventListener("open", (event: RwsEvent) => {
      options.onOpen?.(event);
    });
    ws.addEventListener("close", (event: RwsCloseEvent) => {
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
      ws.close();
    };
    // Only re-run if url or protocols change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, JSON.stringify(options.protocols)]);

  return { sendMessage, lastMessage, ws: wsRef.current };
}
