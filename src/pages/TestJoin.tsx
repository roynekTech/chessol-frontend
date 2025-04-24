import { useEffect, useState } from "react";
import { useWebSocket } from "../utils/useWebSocket";

export default function TestJoin() {
  const { lastMessage, sendMessage } = useWebSocket();
  const [gameId, setGameId] = useState("");

  useEffect(() => {
    console.log("LAST MESSAGE FROM WEBSOCKET ", lastMessage);
  }, [lastMessage]);

  const handleJoin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("gameId", gameId);
    sendMessage(
      JSON.stringify({
        type: "join",
        gameId: gameId,
        walletAddress: "4FUvUSgDiWQbeCSqLfT3zmFC8ornUzNEWAvwJAnvNH5d",
      })
    );
  };

  return (
    <div>
      <h1>Test Join</h1>
      <input
        type="text"
        placeholder="Game ID"
        onChange={(e) => {
          setGameId(e.target.value);
        }}
      />
      <button onClick={handleJoin}>Join</button>
    </div>
  );
}
