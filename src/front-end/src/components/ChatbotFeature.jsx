import React, { useState, useRef, useEffect } from 'react';

// Endpoint da função serverless (Vercel). Por padrão, relativo ao domínio.
const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_API || '/api/chat';
// Contexto usado apenas pelo back-end agora; mantido aqui caso precise enviar junto.
const GEMINI_CONTEXT = `SeedSafe platform context`; // reduzido somente para referência

const ChatMessage = ({ content, sender, isTyping }) => {
  if (isTyping) {
    return (
      <div className="bg-white border-l-4 border-green-700 rounded-md p-3 max-w-[80%] self-start flex gap-1 items-center">
        {[0, 0.2, 0.4].map(delay => (
          <span
            key={delay}
            className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
      </div>
    );
  }

  const classes = sender === 'bot'
    ? 'bg-white border-l-4 border-green-700 self-start'
    : 'bg-green-600 text-white self-end';
  return <div className={`${classes} rounded-md p-3 max-w-[80%] shadow-sm`}>{content}</div>;
};

const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { content: 'Hello! I am AgroBot, SeedSafe\'s assistant. How can I help?', sender: 'bot' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  const keywords = {
    token: ['token', 'harvest', 'future', 'erc-1155', 'erc1155', 'tokenization'],
    carbon: ['carbon', 'tco2', 'tco₂', 'credit', 'environmental', 'green'],
    wallet: ['wallet', 'smart account', 'connect'],
    invest: ['invest', 'buy', 'acquire', 'support'],
    gasless: ['gas', 'fee', 'free', 'no fee', 'gasless']
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    // Add user message
    setMessages(m => [...m, { content: text, sender: 'user' }]);
    setInputValue('');
    setIsTyping(true);

    // Pause briefly to show typing
    setTimeout(async () => {
      const lower = text.toLowerCase();
      let reply = null;

      // Se nenhuma palavra-chave capturada, consulta a API serverless
      if (!reply) {
        try {
          const apiRes = await fetch(CHAT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: `${GEMINI_CONTEXT}. Pergunta: ${text}` })
          });
          const data = await apiRes.json();
          reply = data.answer || 'Desculpe, ocorreu um erro.';
        } catch (err) {
          console.error('Chat API error', err);
          reply = 'Desculpe, ocorreu um erro. Tente novamente em instantes.';
        }
      }

      // add bot response
      setIsTyping(false);
      setMessages(m => [...m, { content: reply, sender: 'bot' }]);
    }, 800);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden h-[500px] border border-gray-200 flex flex-col">
      <div className="bg-green-700 text-white p-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-700">
          <i className="fas fa-robot" />
        </div>
        <h4 className="font-bold">AgroBot</h4>
      </div>
      <div className="flex-grow p-3 overflow-y-auto flex flex-col gap-3 bg-gray-50">
        {messages.map((msg, i) => (
          <ChatMessage key={i} {...msg} />
        ))}
        {isTyping && <ChatMessage isTyping={true} sender="bot" />}
        <div ref={endRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex p-2 border-t border-gray-200">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Type your question..."
          className="flex-grow p-3 border border-gray-200 rounded-md mr-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button type="submit" className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center">
          <i className="fas fa-paper-plane" />
        </button>
      </form>
    </div>
  );
};

const ChatbotFeature = () => (
  <section className="py-12 px-8 bg-white">
    <div className="max-w-6xl mx-auto flex flex-wrap gap-12 items-center">
      <div className="flex-1 min-w-[300px]">
        <h2 className="text-3xl font-bold mb-4">
          Questions? <span className="text-green-700">Our virtual assistant can help</span>
        </h2>
        <p className="mb-6">
          Meet AgroBot, our educational chatbot that will guide you through the world of blockchain, tokens, and sustainable agriculture.
        </p>
        <ul className="mb-6">
          <li className="mb-2 flex items-center gap-2"><i className="fas fa-graduation-cap text-green-700" /> Learn about Web3 and tokenization</li>
          <li className="mb-2 flex items-center gap-2"><i className="fas fa-hands-helping text-green-700" /> Support for onboarding</li>
          <li className="mb-2 flex items-center gap-2"><i className="fas fa-question-circle text-green-700" /> Get answers about the process</li>
        </ul>
        <button className="py-3 px-6 rounded-md font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-all">
          Chat with AgroBot
        </button>
      </div>
      <div className="flex-1 min-w-[350px]">
        <ChatWindow />
      </div>
    </div>
  </section>
);

export default ChatbotFeature;