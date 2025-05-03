import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWebSocketContext } from "../../context/useWebSocketContext";
import { WebSocketMessageTypeEnum } from "../../utils/type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Loader2 } from "lucide-react";

const NOTIFICATION_SOUND_SRC = "/new-notification.mp3";

interface IChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

interface ChatDropdownProps {
  gameId: string;
  walletAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnreadMessage: (count: number) => void;
}

export const ChatDropdown: React.FC<ChatDropdownProps> = ({
  gameId,
  walletAddress,
  open,
  onOpenChange,
  onUnreadMessage,
}) => {
  const { sendMessage, lastMessage } = useWebSocketContext();
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading] = useState(false); // For future: loading state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // sound ref
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    notificationSoundRef.current = new Audio(NOTIFICATION_SOUND_SRC);
    notificationSoundRef.current.load();
    return () => {
      if (notificationSoundRef.current) {
        notificationSoundRef.current.pause();
        notificationSoundRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = () => {
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play();
    }
  };

  // Focus input when chat opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }

    // reset unread messages count when chat is opened
    if (open) {
      setUnreadMessagesCount(0);
    }
  }, [open]);

  // Listen for incoming chat messages
  useEffect(() => {
    if (!lastMessage?.data) return;
    try {
      const data = JSON.parse(lastMessage.data);
      if (data.type === WebSocketMessageTypeEnum.Chat) {
        setMessages((prev) => [
          ...prev,
          {
            sender: data.sender === walletAddress ? "You" : "Opponent",
            message: data.message,
            timestamp: Date.now(),
          },
        ]);
        if (data.sender !== walletAddress) {
          setUnreadMessagesCount((prev) => prev + 1);
          playNotificationSound();
        }
      }
    } catch {
      console.error("Failed to parse chat message:", lastMessage.data);
    }
  }, [lastMessage]);

  // Handle unread messages callback
  useEffect(() => {
    onUnreadMessage(unreadMessagesCount);
  }, [unreadMessagesCount]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Format timestamp
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    setError(null);
    try {
      const chatMsg = {
        type: WebSocketMessageTypeEnum.Chat,
        gameId,
        message: input,
        sender: walletAddress,
      };
      sendMessage(JSON.stringify(chatMsg));
      //   setMessages((prev) => [
      //     ...prev,
      //     { sender: "You", message: input, timestamp: Date.now() },
      //   ]);
      setInput("");
    } catch (err) {
      console.error("Error occurred", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Keyboard send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-1/2 top-0 z-50 w-full max-w-md -translate-x-1/2 mt-8 bg-gradient-to-br from-gray-900/90 to-black/90 rounded-2xl shadow-2xl border border-amber-700/40 backdrop-blur-lg flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-amber-400" />
              <span className="font-semibold text-lg text-white">
                Game Chat
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-red-500"
              onClick={() => onOpenChange(false)}
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div
            className="flex-1 overflow-y-auto px-4 py-2 space-y-2 max-h-80 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-black/20"
            aria-live="polite"
            aria-atomic="false"
          >
            {initialLoading && (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="animate-spin w-6 h-6 text-amber-400" />
              </div>
            )}
            {messages.length === 0 && !initialLoading && (
              <div className="text-center text-gray-500 mt-8">
                No messages yet. Say hello!
              </div>
            )}
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18 }}
                className={`flex flex-col ${
                  msg.sender === "You" ? "items-end" : "items-start"
                }`}
              >
                <span
                  className={`text-xs mb-0.5 ${
                    msg.sender === "You" ? "text-amber-400" : "text-blue-400"
                  }`}
                >
                  {msg.sender}
                  <span className="ml-2 text-gray-500 text-[10px]">
                    {formatTime(msg.timestamp)}
                  </span>
                </span>
                <span
                  className={`px-3 py-2 rounded-xl max-w-xs break-words shadow-md text-sm ${
                    msg.sender === "You"
                      ? "bg-amber-700/80 text-white"
                      : "bg-gray-800/80 text-gray-200"
                  }`}
                >
                  {msg.message}
                </span>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-800/60 bg-black/30">
            <Input
              ref={inputRef}
              className="flex-1 bg-gray-900/80 border-gray-700 text-white rounded-lg focus:ring-amber-500 focus:border-amber-500"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={200}
              aria-label="Chat message input"
              disabled={sending}
            />
            <Button
              variant="default"
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              aria-label="Send message"
            >
              {sending ? <Loader2 className="animate-spin w-4 h-4" /> : "Send"}
            </Button>
          </div>
          {error && (
            <div className="px-4 pb-2 text-red-400 text-xs text-center">
              {error}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatDropdown;
