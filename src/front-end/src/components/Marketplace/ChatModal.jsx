import { useState, useRef, useEffect } from "react";
import { 
  X, 
  Send, 
  User, 
  MessageCircle,
  Smile,
  Paperclip
} from "lucide-react";

const ChatModal = ({ isOpen, onClose, farmerName, cropType }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "This is an example message that you will receive from the farmer",
      sender: "farmer",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    },
    {
      id: 2,
      text: `Hello! I'm interested in your ${cropType}. Could you give me more details about the quality and availability?`,
      sender: "user",
      timestamp: new Date(Date.now() - 240000), // 4 minutes ago
    },
    {
      id: 3,
      text: "Of course! The product has organic certification and is ready for harvest. I can send samples if you'd like.",
      sender: "farmer",
      timestamp: new Date(Date.now() - 180000), // 3 minutes ago
    }
  ]);
  
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Foco no input quando modal abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        text: newMessage.trim(),
        sender: "user",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      
      // Simulate farmer response after 2-3 seconds
      setIsTyping(true);
      setTimeout(() => {
        const responses = [
          "Thank you for your message! I'll check that for you.",
          "Great question! I can help you with that information.",
          "I'll look into the details and get back to you shortly.",
          "Perfect! Let me gather that information for you.",
          "I understand your needs. I'll prepare a proposal for you."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: randomResponse,
          sender: "farmer",
          timestamp: new Date(),
        }]);
        setIsTyping(false);
      }, 2000 + Math.random() * 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[600px] flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center relative">
              <User className="w-5 h-5 text-white" />
              <div className="online-indicator"></div>
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

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex message-item ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 message-bubble ${
                  message.sender === 'user'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p
                  className={`text-xs mt-1 message-time ${
                    message.sender === 'user' ? 'text-amber-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          
          {/* Indicador de digitação */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 max-w-[80%]">
                <div className="flex items-center space-x-1">
                  <div className="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                                      <span className="text-xs text-gray-500 ml-2">typing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input de mensagem */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none chat-textarea chat-input focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent max-h-20 min-h-[44px]"
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '44px',
                  maxHeight: '80px'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                }}
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={`p-3 rounded-lg chat-button transition-all duration-200 ${
                newMessage.trim()
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <button className="p-1 text-gray-400 hover:text-amber-600 transition-colors duration-200">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-1 text-gray-400 hover:text-amber-600 transition-colors duration-200">
                <Smile className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400">
                                Press Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;