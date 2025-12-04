
import React from 'react';
import { Home, ShoppingBag, PlusCircle, User, MessageCircle, LogOut } from 'lucide-react';
import { ModuleType } from '../types';

interface NavigationProps {
  currentView: ModuleType;
  setView: (view: ModuleType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'HOME', icon: Home, label: 'Home' },
    { id: 'BUY', icon: ShoppingBag, label: 'Shop', activeMatch: ['BUY', 'RENT', 'SHARE', 'SWAP', 'EARN', 'ITEM_DETAIL'] },
    { id: 'SELL', icon: PlusCircle, label: 'Post', highlight: true },
    { id: 'CHAT_LIST', icon: MessageCircle, label: 'Chat', activeMatch: ['CHAT_LIST', 'CHAT_ROOM'] }, 
    { id: 'PROFILE', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* Mobile Floating Dock */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <div className="glass rounded-3xl shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] border border-white/50 px-2 py-3 flex justify-between items-center">
          {navItems.map((item) => {
            const isActive = currentView === item.id || (item.activeMatch && item.activeMatch.includes(currentView));
            const Icon = item.icon;
            
            if (item.highlight) {
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as ModuleType)}
                  className="bg-slate-900 text-white w-12 h-12 rounded-full shadow-lg shadow-slate-900/30 flex items-center justify-center transform transition-transform active:scale-90 mx-2 hover:bg-slate-800"
                  aria-label={item.label}
                >
                  <Icon size={24} strokeWidth={2.5} />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ModuleType)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-300 active:scale-95 ${
                  isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`relative ${isActive ? 'transform -translate-y-1' : ''} transition-transform`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-sm' : ''} />
                  {isActive && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"></span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-slate-900/20">S</div>
            Seconds
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id || (item.activeMatch && item.activeMatch.includes(currentView));
            const Icon = item.icon;

            if (item.highlight) {
               return (
                 <button
                   key={item.id}
                   onClick={() => setView(item.id as ModuleType)}
                   className="w-full bg-slate-900 text-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 hover:-translate-y-0.5 transition-all duration-300 font-bold mt-4 mb-8"
                 >
                   <Icon size={20} strokeWidth={2.5} />
                   <span>Post Item</span>
                 </button>
               )
            }

            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ModuleType)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} 
                />
                <span>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600 shadow-[0_0_10px_currentColor]"></div>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors group font-medium">
            <LogOut size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};
