import { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import { X, Send, User } from "lucide-react";
import { getProfile } from "../../services/profileService";
import { useQuery } from "@tanstack/react-query";

const socket = io("http://localhost:3001");

const ChatModal = ({ isOpen, onClose, userId, farmerId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Perfis
  const { data: myProfile } = useQuery({
    queryKey: ["chatModalProfile", userId],
    enabled: !!userId,
    queryFn: () => getProfile(userId),
    staleTime: 120_000,
  });

  const { data: farmerProfile } = useQuery({
    queryKey: ["chatModalProfile", farmerId],
    enabled: !!farmerId,
    queryFn: () => getProfile(farmerId),
    staleTime: 120_000,
  });

  const myAddr = userId?.toLowerCase();
  const peerAddr = farmerId?.toLowerCase();

  useEffect(() => {
    if (isOpen && myAddr && peerAddr) {
      axios
        .get(`http://localhost:3001/messages?from=${myAddr}&to=${peerAddr}`)
        .then((res) => setMessages(res.data))
        .catch(console.error);
    }
  }, [isOpen, myAddr, peerAddr]);

  useEffect(() => {
    socket.on("newMessage", (msg) => {
      const isRelevant =
        (msg.from === myAddr && msg.to === peerAddr) ||
        (msg.from === peerAddr && msg.to === myAddr);
      if (isRelevant) setMessages((prev) => [...prev, msg]);
    });
    return () => socket.off("newMessage");
  }, [myAddr, peerAddr]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !myAddr || !peerAddr) return;
    const payload = {
      from: myAddr,
      to: peerAddr,
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
            <img
              src={
                farmerProfile?.avatarUrl ||
                "https://storage.googleapis.com/seedsafe-assets/default-avatar.png"
              }
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-600"
            />
            <div>
              <h3 className="font-semibold text-gray-800">{farmerProfile?.displayName || farmerId?.slice(0,10)+"..."}</h3>
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
          {messages.map((msg) => {
            const isMine = msg.from === myAddr;
            const avatarUrl = isMine
              ? myProfile?.avatarUrl
              : farmerProfile?.avatarUrl;
            return (
              <div
                key={msg.id ?? msg.created_at}
                className={`flex items-end gap-2 mb-2 ${isMine ? "justify-end" : "justify-start"}`}
              >
                {!isMine && (
                  <img
                    src={
                      avatarUrl ||
                      "https://storage.googleapis.com/seedsafe-assets/default-avatar.png"
                    }
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm break-words ${
                    isMine
                      ? "bg-amber-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200 shadow-sm"
                  }`}
                >
                  {msg.content}
                  <p className="text-xs mt-1 opacity-80">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
                {isMine && (
                  <img
                    src={
                      avatarUrl ||
                      "https://storage.googleapis.com/seedsafe-assets/default-avatar.png"
                    }
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
              </div>
            );
          })}
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
