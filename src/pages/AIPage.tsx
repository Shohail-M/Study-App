import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export const AIPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: `Hello ${user?.name?.split(' ')[0] || 'Archer'}! I'm your Study AI. I notice you have Physics Homework due soon. Would you like me to quiz you on Chapter 7?` }
  ]);
  const [input, setInput] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    const newMsg: Message = { id: Date.now().toString(), sender: 'user', text: userText };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { askGemini } = await import('../lib/gemini');
      const apiKey = user?.settings?.geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY;
      const responseText = await askGemini(userText, apiKey);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText || 'I am unable to process that right now.'
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Error: ${error.message}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between animate-fade-in-up">
        <div>
          <h2 className="text-3xl font-extrabold headline-text text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-4xl">psychology</span>
            Study AI Co-pilot
          </h2>
          <p className="text-on-surface-variant mt-2">Personalized tutoring and planning assistance.</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Online
        </div>
      </div>

      <div className="bg-surface-container-high rounded-2xl border border-white/5 h-[600px] flex flex-col animate-fade-in-up delay-200 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Chat Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 relative z-10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-${msg.sender === 'user' ? 'right' : 'left'}`}>
              <div className={`max-w-[70%] rounded-2xl p-4 ${
                msg.sender === 'user' 
                  ? 'bg-primary text-on-primary rounded-tr-sm' 
                  : 'bg-surface-container-highest text-white border border-white/5 rounded-tl-sm'
              }`}>
                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-2 mb-2 text-primary text-xs font-bold uppercase">
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                    Study AI
                  </div>
                )}
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-surface-container-highest/50 relative z-10">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to explain a concept or generate a quiz..."
              className="w-full bg-surface-container border border-white/10 rounded-full py-4 pl-6 pr-16 text-sm text-white placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIPage;
