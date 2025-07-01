import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import {
  X,
  Send,
  User,
  MessageCircle,
  Smile,
  Paperclip,
} from "lucide-react";

const socket = io("http://localhost:3001");

const ChatModal = ({ isOpen, onClose, userId, farmerId, farmerName, cropType }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      axios
        .get(`http://localhost:3001/messages?from=${userId}&to=${farmerId}`)
        .then((res) => setMessages(res.data))
        .catch(console.error);
    }
  }, [isOpen, userId, farmerId]);

  useEffect(() => {
    socket.on("newMessage", (msg) => {
      const isRelevant =
        (msg.from === userId && msg.to === farmerId) ||
        (msg.from === farmerId && msg.to === userId);
      if (isRelevant) setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off("newMessage");
  }, [userId, farmerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    const payload = {
      from: userId,
      to: farmerId,
      content: newMessage.trim(),
    };
    try {
      await axios.post("http://localhost:3001/send-message", payload);
      setNewMessage("");
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[600px] flex flex-col animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center relative">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{farmerName}</h3>
              <p className="text-xs text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Online now
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-200 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.from === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  msg.from === userId
                    ? "bg-amber-600 text-white"
                    : "bg-white text-gray-800 border border-gray-200 shadow-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.from === userId ? "text-amber-100" : "text-gray-500"
                  }`}
                >
                  {formatTime(msg.created_at)} — {msg.sender_name}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 max-h-20 min-h-[44px]"
                rows={1}
                style={{ height: "auto", minHeight: "44px", maxHeight: "80px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
                }}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`p-3 rounded-lg transition-all duration-200 ${
                newMessage.trim()
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
