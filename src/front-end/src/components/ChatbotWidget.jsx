"use client";

import { useState, useRef, useEffect } from "react";

// endpoint da função serverless
const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_API || '/api/chat';
const GEMINI_CONTEXT = `SeedSafe platform context`;

const ChatMessage = ({ content, sender, isTyping }) => {
  if (isTyping) {
    return (
      <div className="bg-white border-l-4 border-green-700 rounded-md p-3 max-w-[80%] self-start flex gap-1 items-center">
        {[0, 0.2, 0.4].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    );
  }

  const classes =
    sender === "bot"
      ? "bg-white border-l-4 border-green-700 self-start"
      : "bg-green-600 text-white self-end";
  return (
    <div className={`${classes} rounded-md p-3 max-w-[80%] shadow-sm`}>
      {content}
    </div>
  );
};

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([
    {
      content: "Hello! I am AgroBot, SeedSafe's assistant. How can I help?",
      sender: "bot",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    setMessages((m) => [...m, { content: text, sender: "user" }]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(async () => {
      let reply;
      try {
        const apiRes = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: `${GEMINI_CONTEXT}. Pergunta: ${text}` })
        });
        const data = await apiRes.json();
        reply = data.answer || "Desculpe, ocorreu um erro.";
      } catch (err) {
        console.error("Chat API error", err);
        reply = "Desculpe, ocorreu um erro. Tente novamente mais tarde.";
      }

      setIsTyping(false);
      setMessages((m) => [...m, { content: reply, sender: "bot" }]);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
      <div className="bg-green-700 text-white p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-700">
            <i className="fas fa-robot" />
          </div>
          <h4 className="font-bold">AgroBot</h4>
        </div>
        <button
          onClick={onClose}
          className="text-white text-xl focus:outline-none"
        >
          <i className="fas fa-times" />
        </button>
      </div>
      <div className="flex-grow p-3 overflow-y-auto flex flex-col gap-3 bg-gray-50">
        {messages.map((msg, i) => (
          <ChatMessage key={i} {...msg} />
        ))}
        {isTyping && <ChatMessage isTyping sender="bot" />}
        <div ref={endRef} />
      </div>
      <form
        onSubmit={handleSendMessage}
        className="flex p-2 border-t border-gray-200"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your question..."
          className="flex-grow p-2 border border-gray-200 rounded-md mr-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center"
        >
          <i className="fas fa-paper-plane" />
        </button>
      </form>
    </div>
  );
};

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chat window with animation */}
      <div
        className={`fixed bottom-20 right-4 w-80 h-96 z-50 transition-all duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 transform translate-y-0"
            : "opacity-0 transform translate-y-10 pointer-events-none"
        }`}
      >
        <ChatWindow onClose={() => setIsOpen(false)} />
      </div>

      {/* Chat button with animation */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-4 right-4 w-16 h-16 bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:bg-green-800 transition-all duration-300 ${
          isOpen ? "rotate-90" : "rotate-0"
        }`}
        aria-label={isOpen ? "Close Chat" : "Open Chat"}
      >
        <i
          className={`fas ${
            isOpen ? "fa-times" : "fa-comments"
          } text-2xl transition-all`}
        />
      </button>
    </>
  );
};

export default ChatbotWidget;
