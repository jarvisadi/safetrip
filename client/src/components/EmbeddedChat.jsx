import { useState, useEffect, useRef } from 'react';
import { Shield, X, Send } from 'lucide-react';
import api from '../services/api';

const EmbeddedChat = () => {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('safetrip_chat_history')
    if (saved) {
      return JSON.parse(saved)
    }
    return [{ 
      role: 'ai', 
      text: 'Hi! How can I help you stay safe? 👋',
      timestamp: new Date().toISOString()
    }]
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('safetrip_chat_history', JSON.stringify(messages))
  }, [messages]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ 
        lat: pos.coords.latitude, 
        lng: pos.coords.longitude 
      }),
      (err) => setUserLocation({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (messageText = null) => {
    const userMessage = messageText || input.trim();
    if (!userMessage) return;

    setInput('');
    setMessages([...messages, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const response = await api.post('/chat', {
        message: userMessage,
        lat: userLocation.lat,
        lng: userLocation.lng,
        history: messages.slice(-6).map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text
        }))
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: response.data.reply,
          sources: response.data.sources,
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([{ role: 'ai', text: 'Hi! How can I help you stay safe? 👋' }]);
  };

  const suggestedQuestions = [
    { emoji: '🗺️', text: 'Nearest police?' },
    { emoji: '🐯', text: 'Wildlife nearby?' },
    { emoji: '⚠️', text: 'Trail safety?' },
    { emoji: '📍', text: 'Where am I?' }
  ];

  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm flex flex-col overflow-hidden" style={{ height: '420px', width: '100%' }}>
      {/* Header */}
      <div className="h-10 bg-[#1B4332] px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">SafeTrip AI</span>
          <div className="w-2 h-2 bg-green-400 rounded-full ml-1" />
        </div>
        <button 
          onClick={handleClearChat}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="overflow-y-auto px-4 py-3 space-y-3" style={{ height: '280px' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-[#1B4332] text-white rounded-xl rounded-tr-sm'
                  : 'bg-white border border-[#E7E5E4] text-[#1C1917] rounded-xl rounded-tl-sm'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
              <p className="text-[10px] mt-1 opacity-60">
                {getTimestamp()}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E7E5E4] rounded-xl rounded-tl-sm px-3 py-2">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-[#78716C] rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-[#78716C] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-[#78716C] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && !loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-2 flex-shrink-0">
          {suggestedQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sq.text)}
              className="text-xs px-3 py-1.5 bg-stone-100 text-[#78716C] rounded-full hover:bg-stone-200 transition-colors"
            >
              {sq.emoji} {sq.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="h-[60px] px-4 py-2 border-t border-[#E7E5E4] flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask anything..."
          disabled={loading}
          className="flex-1 bg-stone-50 border border-[#E7E5E4] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent disabled:bg-stone-100 disabled:text-[#A8A29E]"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="w-9 h-9 bg-[#1B4332] text-white rounded-full flex items-center justify-center hover:bg-[#14532D] transition-colors disabled:bg-stone-300 disabled:text-[#A8A29E] disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default EmbeddedChat;
