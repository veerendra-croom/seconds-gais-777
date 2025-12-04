import React, { useEffect, useState, useRef } from 'react';
import { ModuleType, Item, UserProfile, Notification } from '../types';
import { ShoppingCart, Tag, Clock, Users, Repeat, Briefcase, HandHeart, Search, Bell, Sparkles, X, Camera, Loader2, History } from 'lucide-react';
import { api } from '../services/api';
import { ItemCard } from '../components/ItemCard';
import { analyzeImageForSearch } from '../services/geminiService';
import { useToast } from '../components/Toast';

interface HomeProps {
  user: UserProfile;
  onModuleSelect: (module: ModuleType) => void;
  onItemClick?: (item: Item) => void;
  onSearch: (query: string) => void;
}

const modules = [
  { id: 'BUY', label: 'Buy', icon: ShoppingCart, color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
  { id: 'SELL', label: 'Sell', icon: Tag, color: 'bg-green-500', gradient: 'from-green-400 to-green-600' },
  { id: 'RENT', label: 'Rent', icon: Clock, color: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600' },
  { id: 'SHARE', label: 'Share', icon: Users, color: 'bg-teal-500', gradient: 'from-teal-400 to-teal-600' },
  { id: 'SWAP', label: 'Swap', icon: Repeat, color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
  { id: 'EARN', label: 'Earn', icon: Briefcase, color: 'bg-rose-500', gradient: 'from-rose-400 to-rose-600' },
  { id: 'REQUEST', label: 'Request', icon: HandHeart, color: 'bg-indigo-500', gradient: 'from-indigo-400 to-indigo-600' },
];

export const Home: React.FC<HomeProps> = ({ user, onModuleSelect, onItemClick, onSearch }) => {
  const [trendingItems, setTrendingItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

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
    fetchNotifications();
    
    // Subscribe to realtime notifications
    const subscription = api.subscribeToNotifications(user.id, (newNotif) => {
       setNotifications(prev => [newNotif, ...prev]);
       showToast(newNotif.title, 'info');
    });

    const stored = localStorage.getItem('recent_searches');
    if (stored) setRecentSearches(JSON.parse(stored));

    return () => {
      subscription.unsubscribe();
    };
  }, [user.id]);

  const fetchNotifications = async () => {
    try {
      const notes = await api.getNotifications(user.id);
      setNotifications(notes);
    } catch (e) { console.error(e); }
  }

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      const newHistory = [searchQuery, ...recentSearches.filter(q => q !== searchQuery)].slice(0, 5);
      localStorage.setItem('recent_searches', JSON.stringify(newHistory));
      onSearch(searchQuery);
    }
  };

  const handleImageSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnalyzingImage(true);
      showToast("Analyzing image...", 'info');
      try {
        const term = await analyzeImageForSearch(e.target.files[0]);
        if (term) {
          setSearchQuery(term);
          showToast(`Found: ${term}`, 'success');
          onSearch(term); 
        } else {
          showToast("Could not identify item.", 'error');
        }
      } catch (err) { showToast("Visual search failed", 'error'); } 
      finally { setAnalyzingImage(false); }
    }
  };

  return (
    <div className="pb-32 md:pb-8 max-w-7xl mx-auto min-h-screen">
      {/* Premium Header */}
      <header className="px-6 pt-12 pb-4 sticky top-0 md:static z-30 transition-all">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              Hello, {user.name?.split(' ')[0]} <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-sm text-slate-500 font-medium flex items-center mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              {user.college}
            </p>
          </div>
          
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="glass w-12 h-12 rounded-full flex items-center justify-center relative shadow-sm hover:shadow-md transition-all active:scale-95"
          >
             <Bell className="text-slate-700" size={22} />
             {notifications.some(n => !n.isRead) && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
        </div>

        {/* Floating Search */}
        <div className="relative z-30">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl blur-lg opacity-40 group-focus-within:opacity-70 transition-opacity`}></div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={analyzingImage ? "Analyzing..." : "Search items, services..."}
              className="relative w-full bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:shadow-[0_8px_30px_rgb(0,0,0,0.08)] outline-none transition-all placeholder:text-slate-400"
              disabled={analyzingImage}
            />
            <Search className="absolute left-4 top-4 text-slate-400" size={20} />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-primary-500 hover:bg-slate-100 rounded-lg transition-all"
            >
              {analyzingImage ? <Loader2 size={20} className="animate-spin"/> : <Camera size={20} />}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSearch} />
          </form>
        </div>
      </header>

      {/* Holographic Stats Card */}
      <div className="px-6 py-2 animate-slide-up">
        <div className="holo-card rounded-[32px] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
          <div className="relative z-10">
             <div className="flex items-center space-x-2 text-blue-100 mb-2">
                <Sparkles size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">Sustainability Impact</span>
             </div>
             <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tighter">${user.savings || 0}</span>
                <span className="text-lg font-medium text-blue-100">saved</span>
             </div>
             
             <div className="mt-6 flex gap-8">
                <div>
                   <p className="text-2xl font-bold">12kg</p>
                   <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">CO₂ Saved</p>
                </div>
                <div>
                   <p className="text-2xl font-bold">8</p>
                   <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Items</p>
                </div>
             </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="px-6 mt-10">
        <h3 className="font-bold text-slate-900 mb-6 text-lg">Explore Campus</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => onModuleSelect(mod.id as ModuleType)}
                className="flex flex-col items-center gap-2 group animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`
                  w-16 h-16 rounded-[20px] bg-gradient-to-br ${mod.gradient}
                  flex items-center justify-center text-white shadow-lg shadow-slate-200
                  transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1
                `}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                  {mod.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Trending */}
      <div className="mt-12 px-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 text-lg">Trending Now</h3>
          <button className="text-sm font-bold text-primary-600 hover:text-primary-700">See All</button>
        </div>
        
        {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[1, 2].map((i) => <div key={i} className="bg-slate-100 rounded-2xl h-48 animate-pulse"></div>)}
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {trendingItems.map((item, i) => (
                <div key={item.id} className="animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                   <ItemCard item={item} onClick={() => onItemClick && onItemClick(item)} />
                </div>
             ))}
          </div>
        )}
      </div>
      
      {/* Mobile Notification Sheet */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden" onClick={() => setShowNotifications(false)}>
           <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-xl">Notifications</h3>
                 <button onClick={() => setShowNotifications(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
              </div>
              <div className="space-y-3">
                 {notifications.length === 0 ? <p className="text-center text-slate-400 py-10">No new alerts</p> : 
                   notifications.map(n => (
                     <div key={n.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="font-bold text-sm text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                     </div>
                   ))
                 }
              </div>
           </div>
        </div>
      )}
    </div>
  );
};