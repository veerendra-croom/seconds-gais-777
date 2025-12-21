
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Sparkles, X, ChevronRight } from 'lucide-react';
import { useToast } from './Toast';
import { ModuleType } from '../types';

interface VoiceCommanderProps {
  onNavigate: (view: ModuleType) => void;
  onSearch: (query: string) => void;
  onLogout: () => void;
}

export const VoiceCommander: React.FC<VoiceCommanderProps> = ({ onNavigate, onSearch, onLogout }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript.toLowerCase();
        setTranscript(text);
        processCommand(text);
      };

      setRecognition(rec);
    }
  }, []);

  const processCommand = (cmd: string) => {
    if (cmd.includes('home')) onNavigate('HOME');
    else if (cmd.includes('market') || cmd.includes('buy')) onNavigate('BUY');
    else if (cmd.includes('sell') || cmd.includes('post')) onNavigate('SELL');
    else if (cmd.includes('chat') || cmd.includes('messages')) onNavigate('CHAT_LIST');
    else if (cmd.includes('profile')) onNavigate('PROFILE');
    else if (cmd.includes('search for')) {
      const query = cmd.split('search for')[1].trim();
      onSearch(query);
    } else if (cmd.includes('sign out') || cmd.includes('logout')) {
      onLogout();
    } else {
      showToast(`Command not recognized: "${cmd}"`, 'info');
    }
  };

  const toggleListening = () => {
    if (isListening) recognition?.stop();
    else recognition?.start();
  };

  return (
    <>
      <button 
        onClick={toggleListening}
        className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 z-[100] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 scale-100 hover:scale-110 active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-900 text-white'}`}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>

      {isListening && (
        <div className="fixed inset-0 z-[101] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in">
           <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.4)]">
              <Sparkles className="text-white animate-spin-slow" size={40} />
           </div>
           <h2 className="text-3xl font-black text-white mb-2">Listening...</h2>
           <p className="text-slate-400 text-lg font-medium text-center max-w-sm mb-12 italic">
             {transcript || '"Go to Marketplace", "Search for books"...'}
           </p>
           <button onClick={() => setIsListening(false)} className="px-8 py-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all font-bold">Cancel</button>
        </div>
      )}
    </>
  );
};
