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
    { id: 'CHAT_LIST', icon: MessageCircle, label: 'Messages', activeMatch: ['CHAT_LIST', 'CHAT_ROOM'] }, // Renamed to Messages and mapped to CHAT_LIST
    { id: 'PROFILE', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe z-50 transition-all duration-300">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id || (item.activeMatch && item.activeMatch.includes(currentView));
            const Icon = item.icon;
            
            if (item.highlight) {
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as ModuleType)}
                  className="relative -top-5 bg-gradient-to-tr from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white p-4 rounded-full shadow-lg shadow-primary-500/40 transition-transform active:scale-95 flex flex-col items-center justify-center border-[4px] border-slate-50"
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
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-90 ${
                  isActive ? 'text-primary-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="transition-all" />
                <span className={`text-[10px] font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-50 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 tracking-tight">
            <span className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-primary-500 rounded-lg flex items-center justify-center text-white text-lg shadow-md">S</span>
            Seconds
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id || (item.activeMatch && item.activeMatch.includes(currentView));
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ModuleType)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm ring-1 ring-primary-100' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon 
                  size={20} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`transition-colors ${isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'}`} 
                />
                <span>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600"></div>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group">
            <LogOut size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};