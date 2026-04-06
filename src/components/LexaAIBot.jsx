import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiX, FiSend, FiCpu } from 'react-icons/fi';
import api from '../services/api';

const LexaAIBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: "Hi! I'm LexaCore AI. I can navigate the CRM, summarize leads, or draft reports. How can I help?", sender: 'bot' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { userInfo } = useSelector(state => state.auth);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { text: userText, sender: 'user' }]);
    setInput('');
    setLoading(true);

    // Simulate thinking delay
    setTimeout(() => {
      processCommand(userText.toLowerCase());
    }, 1000);
  };

  const processCommand = async (cmd) => {
    let reply = "I'm sorry, I didn't quite catch that. Try asking me to 'Show hot leads' or 'Navigate to invoices'.";
    
    // Routing Intents
    if (cmd.includes('invoice')) {
      reply = "Navigating to Invoices now!";
      navigate(`/${userInfo?.role}/invoices`);
    } else if (cmd.includes('task') || cmd.includes('todo')) {
      reply = "Opening your tasks management...";
      navigate(`/${userInfo?.role}/tasks`);
    } else if (cmd.includes('dashboard') || cmd.includes('home')) {
      reply = "Taking you back to the main dashboard.";
      navigate(`/${userInfo?.role}/dashboard`);
    } 
    // Data Intents
    else if (cmd.includes('lead')) {
      try {
        const { data } = await api.get('/leads');
        const count = data.length;
        const hotLeads = data.filter(l => l.email && l.mobileNo).length; // Crude hot estimation
        reply = `You currently have ${count} total leads in the pipeline. Based on structural metrics, approximately ${hotLeads} are deemed High-Priority / Hot! Would you like me to navigate to the Leads page?`;
        if (cmd.includes('hot') || cmd.includes('best')) {
             reply += "\n\n(Tip: The Leads Table will automatically sort your hottest prospects to the top algorithmically!)";
        }
      } catch (err) {
        reply = "I tried to check your leads, but couldn't fetch the data right now.";
      }
    } 
    // Action Intents
    else if (cmd.includes('report') || cmd.includes('draft') || cmd.includes('summary')) {
      try {
        const { data } = await api.get('/reports/auto-draft');
        reply = "Here is an auto-generated draft of your work today based on system metrics:\n\n" + data.draft;
      } catch (err) {
        reply = "I tried to auto-draft your report, but ran into an issue connecting to the engine.";
      }
    } else if (cmd.includes('hello') || cmd.includes('hi')) {
       reply = `Hello ${userInfo?.name?.split(' ')[0]}! Ready to crush some goals today?`;
    } else if (cmd.includes('who are you') || cmd.includes('what are you')) {
       reply = "I am LexaCore AI, your built-in CRM Co-Pilot! I run natively inside this platform to help you analyze data and navigate seamlessly.";
    } else if (cmd.includes('thank')) {
       reply = "You're very welcome! Let me know if you need anything else.";
    }

    setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transition-all transform ease-out duration-300">
          <div className="bg-primary-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FiCpu className="text-lg" />
              </div>
              <h3 className="font-bold">LexaCore AI Co-Pilot</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-md transition-colors"><FiX className="text-xl" /></button>
          </div>
          
          <div className="h-96 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} text-sm`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.sender === 'user' ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white shadow-sm border border-gray-200 text-gray-800 rounded-bl-sm whitespace-pre-line'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start text-sm">
                <div className="bg-white shadow-sm border border-gray-200 text-gray-400 rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask LexaCore to do something..."
              className="flex-grow bg-gray-100 border-none rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              disabled={loading}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-primary-600 text-white p-2.5 rounded-full hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <FiSend />
            </button>
          </form>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 border-4 border-white"
        >
          <FiCpu className="text-2xl animate-pulse" />
        </button>
      )}
    </div>
  );
};
export default LexaAIBot;
