import React, { useEffect, useState } from 'react';
import { ModuleType, Item, UserProfile } from '../types';
import { ShoppingCart, Tag, Clock, Users, Repeat, Briefcase, HandHeart, Search, Bell, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { ItemCard } from '../components/ItemCard';

interface HomeProps {
  user: UserProfile;
  onModuleSelect: (module: ModuleType) => void;
  onItemClick?: (item: Item) => void;
}

const modules = [
  { id: 'BUY', label: 'Buy', icon: ShoppingCart, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
  { id: 'SELL', label: 'Sell', icon: Tag, color: 'from-green-500 to-green-600', shadow: 'shadow-green-200' },
  { id: 'RENT', label: 'Rent', icon: Clock, color: 'from-orange-500 to-orange-600', shadow: 'shadow-orange-200' },
  { id: 'SHARE', label: 'Share', icon: Users, color: 'from-teal-500 to-teal-600', shadow: 'shadow-teal-200' },
  { id: 'SWAP', label: 'Swap', icon: Repeat, color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-200' },
  { id: 'EARN', label: 'Earn', icon: Briefcase, color: 'from-rose-500 to-rose-600', shadow: 'shadow-rose-200' },
  { id: 'REQUEST', label: 'Request', icon: HandHeart, color: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-200' },
];

export const Home: React.FC<HomeProps> = ({ user, onModuleSelect, onItemClick }) => {
  const [trendingItems, setTrendingItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const items = await api.getTrendingItems();
        setTrendingItems(items);
      } catch (e) {
        console.error("Failed to load trending items", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="pb-28 md:pb-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md md:bg-transparent md:pt-8 px-4 pt-4 pb-4 sticky top-0 md:static z-20 border-b border-slate-100 md:border-none transition-all">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex justify-between items-center mb-0">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-slate-800 tracking-tight">
                Hello, {user.name?.split(' ')[0] || 'Student'} <span className="inline-block animate-wave">👋</span>
              </h1>
              <p className="text-xs md:text-sm text-slate-500 flex items-center mt-1 font-medium">
                <span className="relative flex h-2.5 w-2.5 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                {user.college || 'My Campus'}
              </p>
            </div>
            <button className="relative md:hidden p-2 hover:bg-slate-100 rounded-full transition-colors">
               <Bell className="text-slate-600" size={24} />
               <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>

          <div className="flex-1 md:max-w-md mx-auto w-full">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search items, services, or peers..." 
                className="w-full bg-slate-100 md:bg-white border border-transparent md:border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none shadow-sm transition-all"
              />
              <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
             <button className="relative bg-white p-3 rounded-full shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50 hover:shadow-md transition-all">
               <Bell className="text-slate-600" size={20} />
               <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="flex items-center space-x-2 bg-white pl-1 pr-3 py-1 rounded-full border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50">
                <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full" />
                <span className="text-sm font-medium text-slate-700">{user.name?.split(' ')[0]}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="px-4 py-2">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-primary-900/20 md:flex md:items-center md:justify-between relative overflow-hidden group">
          
          {/* Decorative Circles */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-1000"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-500/30 rounded-full blur-3xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
             <div className="space-y-1">
                <div className="flex items-center space-x-2 text-primary-100 mb-1">
                   <Sparkles size={16} />
                   <span className="text-xs md:text-sm font-medium uppercase tracking-wider">Total Impact</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">${user.savings || 0}</h2>
                <p className="text-primary-100 text-sm">Saved this semester</p>
             </div>
             
             <div className="h-px w-full md:w-px md:h-16 bg-white/20 my-4 md:my-0"></div>

             <div className="grid grid-cols-2 gap-8 md:gap-12">
                <div>
                   <p className="text-2xl font-bold">12kg</p>
                   <p className="text-xs text-primary-200">CO₂ Avoided</p>
                </div>
                <div>
                   <p className="text-2xl font-bold">8</p>
                   <p className="text-xs text-primary-200">Items Recycled</p>
                </div>
             </div>
          </div>

          <div className="relative z-10 mt-6 md:mt-0">
             <button className="w-full md:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
                View Analytics
             </button>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="px-4 mt-8">
        <h3 className="font-bold text-slate-800 mb-6 text-lg md:text-xl flex items-center">
          What would you like to do?
        </h3>
        <div className="grid grid-cols-3 xs:grid-cols-4 md:grid-cols-7 gap-4 md:gap-8">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => onModuleSelect(mod.id as ModuleType)}
                className="flex flex-col items-center gap-3 group"
              >
                <div className={`
                  bg-gradient-to-br ${mod.color} 
                  w-full aspect-square rounded-2xl md:rounded-3xl shadow-lg ${mod.shadow} 
                  flex items-center justify-center text-white 
                  transform transition-all duration-300 
                  group-hover:-translate-y-1 group-hover:shadow-xl group-active:scale-95
                  max-w-[70px] md:max-w-[90px]
                `}>
                  <Icon size={28} className="md:w-8 md:h-8" />
                </div>
                <span className="text-xs md:text-sm font-medium text-slate-600 group-hover:text-primary-600 transition-colors text-center leading-tight">
                  {mod.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending Section */}
      <div className="mt-10 px-4">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-bold text-slate-800 text-lg md:text-xl">Trending in Campus</h3>
          <button className="text-sm text-primary-600 font-semibold hover:text-primary-700 hover:underline">View All</button>
        </div>
        
        {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className={`bg-white rounded-2xl p-3 border border-slate-100 shadow-sm animate-pulse ${i > 2 ? 'hidden md:block' : ''}`}>
                  <div className="aspect-[4/3] bg-slate-100 rounded-xl mb-3"></div>
                  <div className="h-4 w-3/4 bg-slate-100 rounded mb-2"></div>
               </div>
             ))}
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {trendingItems.map((item) => (
                <ItemCard key={item.id} item={item} onClick={() => onItemClick && onItemClick(item)} />
             ))}
             {trendingItems.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400 text-sm">
                   No trending items yet. Be the first to list something!
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};