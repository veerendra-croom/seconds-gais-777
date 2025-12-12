
import React from 'react';
import { Home, Search } from 'lucide-react';

interface NotFoundViewProps {
  onGoHome: () => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onGoHome }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-8 relative">
         <span className="text-6xl">🔭</span>
         <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-full shadow-lg">
            <Search size={24} className="text-slate-400" />
         </div>
      </div>
      
      <h1 className="text-4xl font-black text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-slate-500 max-w-xs mb-8">
         Oops! It looks like this page has been moved or doesn't exist anymore.
      </p>
      
      <button 
        onClick={onGoHome}
        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
      >
         <Home size={18} /> Go Home
      </button>
    </div>
  );
};
