import React from 'react';
import { ModuleType } from '../types';
import { ShoppingCart, Tag, Clock, Users, Repeat, Briefcase, HandHeart, Search, Bell } from 'lucide-react';
import { UserProfile } from '../types';

interface HomeProps {
  user: UserProfile;
  onModuleSelect: (module: ModuleType) => void;
}

const modules = [
  { id: 'BUY', label: 'Buy', icon: ShoppingCart, color: 'bg-blue-500' },
  { id: 'SELL', label: 'Sell', icon: Tag, color: 'bg-green-500' },
  { id: 'RENT', label: 'Rent', icon: Clock, color: 'bg-orange-500' },
  { id: 'SHARE', label: 'Share', icon: Users, color: 'bg-teal-500' },
  { id: 'SWAP', label: 'Swap', icon: Repeat, color: 'bg-purple-500' },
  { id: 'EARN', label: 'Earn', icon: Briefcase, color: 'bg-rose-500' },
  { id: 'REQUEST', label: 'Request', icon: HandHeart, color: 'bg-indigo-500' },
];

export const Home: React.FC<HomeProps> = ({ user, onModuleSelect }) => {
  return (
    <div className="pb-24 md:pb-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="bg-white md:bg-transparent md:pt-8 px-4 pt-6 pb-4 sticky top-0 md:static z-10 border-b border-slate-100 md:border-none">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex justify-between items-center mb-0">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">Hello, {user.name.split(' ')[0]} 👋</h1>
              <p className="text-xs md:text-sm text-slate-500 flex items-center mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
                {user.college}
              </p>
            </div>
            <div className="relative md:hidden">
               <Bell className="text-slate-600" size={24} />
               <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
          </div>

          <div className="relative md:w-96">
            <input 
              type="text" 
              placeholder="Search items, services, or peers..." 
              className="w-full bg-slate-100 md:bg-white border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-sm"
            />
            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          </div>
          
          <div className="hidden md:block relative">
             <div className="bg-white p-2 rounded-full shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50">
               <Bell className="text-slate-600" size={20} />
               <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
             </div>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="px-4 py-4">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg md:flex md:items-center md:justify-between">
          <div className="flex justify-between items-start md:block md:space-y-2">
            <div>
              <p className="text-primary-100 text-xs md:text-sm font-medium mb-1">Total Savings</p>
              <h2 className="text-3xl md:text-4xl font-bold">${user.savings}</h2>
            </div>
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm md:inline-block md:mt-2">
              <span className="text-xs font-semibold">Verified Student</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between md:border-t-0 md:mt-0 md:pt-0 md:flex-col md:space-y-2 md:items-end text-xs md:text-sm text-primary-100">
            <span>Carbon Saved: 12kg</span>
            <span>Items Traded: 8</span>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="px-4 mt-4">
        <h3 className="font-bold text-slate-800 mb-4 text-lg">What would you like to do?</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4 md:gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => onModuleSelect(mod.id as ModuleType)}
                className="flex flex-col items-center space-y-2 group"
              >
                <div className={`${mod.color} w-full aspect-square flex items-center justify-center rounded-2xl shadow-sm group-hover:shadow-md group-active:scale-95 transition-all text-white max-w-[80px]`}>
                  <Icon size={28} />
                </div>
                <span className="text-xs md:text-sm font-medium text-slate-600 group-hover:text-primary-600">{mod.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Section */}
      <div className="mt-8 px-4 pb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">Trending in Campus</h3>
          <button className="text-xs md:text-sm text-primary-600 font-medium hover:text-primary-700">View All</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {/* Placeholder for trending items visual */}
           <div className="bg-slate-100 h-40 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium border border-slate-200">Ad 1</div>
           <div className="bg-slate-100 h-40 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium border border-slate-200">Ad 2</div>
           <div className="hidden md:flex bg-slate-100 h-40 rounded-xl items-center justify-center text-slate-400 text-sm font-medium border border-slate-200">Ad 3</div>
           <div className="hidden md:flex bg-slate-100 h-40 rounded-xl items-center justify-center text-slate-400 text-sm font-medium border border-slate-200">Ad 4</div>
        </div>
      </div>
    </div>
  );
};