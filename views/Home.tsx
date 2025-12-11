
import React, { useEffect, useState, useRef } from 'react';
import { ModuleType, Item, UserProfile, Notification } from '../types';
import { ShoppingCart, Tag, Clock, Users, Repeat, Briefcase, HandHeart, Search, Bell, Sparkles, X, Camera, Loader2, History, ChevronRight, Mic, MicOff, Download, Smartphone, BellRing } from 'lucide-react';
import { api } from '../services/api';
import { ItemCard } from '../components/ItemCard';
import { analyzeImageForSearch } from '../services/geminiService';
import { useToast } from '../components/Toast';
import { SustainabilityModal } from '../components/SustainabilityModal';

interface HomeProps {
  user: UserProfile;
  onModuleSelect: (module: ModuleType, params?: any) => void;
  onItemClick?: (item: Item) => void;
  onSearch: (query: string) => void;
  onNotificationClick?: (notification: Notification) => void;
}

const allModules = [
  { id: 'BUY', label: 'Buy', icon: ShoppingCart, color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600' },
  { id: 'SELL', label: 'Sell', icon: Tag, color: 'bg-green-500', gradient: 'from-green-400 to-green-600' },
  { id: 'RENT', label: 'Rent', icon: Clock, color: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600' },
  { id: 'SHARE', label: 'Share', icon: Users, color: 'bg-teal-500', gradient: 'from-teal-400 to-teal-600' },
  { id: 'SWAP', label: 'Swap', icon: Repeat, color: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600' },
  { id: 'EARN', label: 'Earn', icon: Briefcase, color: 'bg-rose-500', gradient: 'from-rose-400 to-rose-600' },
  { id: 'REQUEST', label: 'Request', icon: HandHeart, color: 'bg-indigo-500', gradient: 'from-indigo-400 to-indigo-600' },
];

export const Home: React.FC<HomeProps> = ({ user, onModuleSelect, onItemClick, onSearch, onNotificationClick }) => {
  const [trendingItems, setTrendingItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSustainability, setShowSustainability] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [enabledModules, setEnabledModules] = useState(allModules);
  const [appBanner, setAppBanner] = useState('');
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  
  // Notification State
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [items, configs] = await Promise.all([
           api.getTrendingItems(),
           api.getAllAppConfigs()
        ]);
        setTrendingItems(items);
        
        // Handle Global Banner
        if (configs['global_banner_active'] === 'true' && configs['global_banner_text']) {
           setAppBanner(configs['global_banner_text']);
        }

        // Handle Feature Flags
        if (configs['active_modules']) {
           try {
              const activeMap = JSON.parse(configs['active_modules']);
              const filtered = allModules.filter(m => activeMap[m.id] !== false); // Default true if missing
              setEnabledModules(filtered);
           } catch (e) {
              console.error("Failed to parse module config", e);
           }
        }

      } catch (e) {
        console.error("Failed to load home data", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    fetchNotifications();
    
    // Check Notification Permission
    if ('Notification' in window && Notification.permission === 'default') {
       setTimeout(() => setShowNotificationPrompt(true), 3000); // Delay slightly
    }
    
    // Subscribe to realtime notifications
    const subscription = api.subscribeToNotifications(user.id, (newNotif) => {
       setNotifications(prev => [newNotif, ...prev]);
       showToast(newNotif.title, 'info');
    });

    const stored = localStorage.getItem('recent_searches');
    if (stored) setRecentSearches(JSON.parse(stored));

    // PWA Install Prompt Listener
    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, [user.id]);

  const fetchNotifications = async () => {
    try {
      const notes = await api.getNotifications(user.id);
      setNotifications(notes);
    } catch (e) { console.error(e); }
  }

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) return;
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
       setShowNotificationPrompt(false);
       showToast("Notifications enabled!", 'success');
       
       // Register Subscription via Service Worker
       if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          // In real app, convert VAPID key: urlBase64ToUint8Array(publicVapidKey)
          // const sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: ... });
          // await api.registerPushDevice(user.id, sub);
          console.log("Push registered (mock)");
       }
    } else {
       setShowNotificationPrompt(false);
    }
  };

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      const newHistory = [searchQuery, ...recentSearches.filter(q => q !== searchQuery)].slice(0, 5);
      localStorage.setItem('recent_searches', JSON.stringify(newHistory));
      setRecentSearches(newHistory); // Update state immediately
      onSearch(searchQuery);
    }
  };

  const handleRecentClick = (term: string) => {
    setSearchQuery(term);
    onSearch(term);
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
          // Add to history
          const newHistory = [term, ...recentSearches.filter(q => q !== term)].slice(0, 5);
          localStorage.setItem('recent_searches', JSON.stringify(newHistory));
          setRecentSearches(newHistory);
          
          onSearch(term); 
        } else {
          showToast("Could not identify item.", 'error');
        }
      } catch (err) { showToast("Visual search failed", 'error'); } 
      finally { setAnalyzingImage(false); }
    }
  };

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        
        // Save to history and search
        const newHistory = [transcript, ...recentSearches.filter(q => q !== transcript)].slice(0, 5);
        localStorage.setItem('recent_searches', JSON.stringify(newHistory));
        setRecentSearches(newHistory);
        onSearch(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        showToast("Voice search error. Please try again.", 'error');
      };

      recognition.start();
    } else {
      showToast("Voice search not supported in this browser.", 'error');
    }
  };

  return (
    <div className="pb-32 md:pb-8 max-w-7xl mx-auto min-h-screen relative">
      {/* Voice Listening Overlay */}
      {isListening && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.5)]">
              <Mic size={48} className="text-white" />
           </div>
           <p className="mt-8 text-white text-xl font-bold tracking-wide animate-bounce">Listening...</p>
           <button 
             onClick={() => window.location.reload()} // Quick way to stop if stuck, or implement proper stop
             className="mt-8 px-6 py-2 bg-white/20 rounded-full text-white text-sm hover:bg-white/30 transition-colors"
           >
             Cancel
           </button>
        </div>
      )}

      {/* Global Announcement Banner */}
      {appBanner && (
        <div className="bg-indigo-600 text-white px-6 py-3 text-center text-sm font-bold shadow-sm animate-slide-up sticky top-0 z-40">
           {appBanner}
        </div>
      )}

      {/* Premium Header */}
      <header className={`px-6 pt-12 pb-4 ${appBanner ? 'md:pt-4' : 'sticky top-0 md:static'} z-30 transition-all`}>
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
            onClick={() => onModuleSelect('NOTIFICATIONS')}
            className="glass w-12 h-12 rounded-full flex items-center justify-center relative shadow-sm hover:shadow-md transition-all active:scale-95"
          >
             <Bell className="text-slate-700" size={22} />
             {notifications.some(n => !n.isRead) && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
        </div>

        {/* Notification Permission Banner */}
        {showNotificationPrompt && (
           <div className="mb-6 bg-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-xl text-white animate-slide-up">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 rounded-xl"><BellRing size={20} /></div>
                 <div>
                    <p className="font-bold text-sm">Stay Updated</p>
                    <p className="text-xs text-slate-400">Get alerts for new messages & offers</p>
                 </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setShowNotificationPrompt(false)} className="text-xs font-bold text-slate-400 hover:text-white p-2">Later</button>
                 <button onClick={handleEnableNotifications} className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-slate-200">Enable</button>
              </div>
           </div>
        )}

        {/* Floating Search */}
        <div className="relative z-30">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl blur-lg opacity-40 group-focus-within:opacity-70 transition-opacity`}></div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={analyzingImage ? "Analyzing..." : "Search items, services..."}
              className="relative w-full bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl py-4 pl-12 pr-24 text-sm font-medium shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:shadow-[0_8px_30px_rgb(0,0,0,0.08)] outline-none transition-all placeholder:text-slate-400"
              disabled={analyzingImage}
            />
            <Search className="absolute left-4 top-4 text-slate-400" size={20} />
            
            <div className="absolute right-3 top-3 flex items-center gap-1">
              <button 
                type="button"
                onClick={startVoiceSearch}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Voice Search"
              >
                <Mic size={20} />
              </button>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-slate-100 rounded-lg transition-all"
                title="Image Search"
              >
                {analyzingImage ? <Loader2 size={20} className="animate-spin"/> : <Camera size={20} />}
              </button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSearch} />
          </form>
        </div>

        {/* Recent Searches Chips */}
        {recentSearches.length > 0 && !searchQuery && (
          <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear-fade">
            {recentSearches.map(term => (
              <button 
                key={term} 
                onClick={() => handleRecentClick(term)} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm hover:text-primary-600 transition-all whitespace-nowrap animate-in fade-in zoom-in duration-300"
              >
                <History size={12} className="text-slate-400"/> {term}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Holographic Stats Card - Clickable now */}
      <div className="px-6 py-2 animate-slide-up">
        <div 
          onClick={() => setShowSustainability(true)}
          className="holo-card rounded-[32px] p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
        >
          <div className="relative z-10">
             <div className="flex items-center justify-between mb-2">
               <div className="flex items-center space-x-2 text-blue-100">
                  <Sparkles size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">Sustainability Impact</span>
               </div>
               <ChevronRight size={16} className="text-white/70" />
             </div>
             <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tighter">${user.savings || 0}</span>
                <span className="text-lg font-medium text-blue-100">saved</span>
             </div>
             
             <div className="mt-6 flex gap-8">
                <div>
                   <p className="text-2xl font-bold">{Math.floor((user.savings || 0) * 0.15)}kg</p>
                   <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">CO₂ Saved</p>
                </div>
                <div>
                   <p className="text-2xl font-bold">Top 5%</p>
                   <p className="text-xs text-blue-200 uppercase font-bold tracking-wider">Campus Rank</p>
                </div>
             </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
        </div>
      </div>

      {/* Install App Banner */}
      {installPrompt && (
        <div className="px-6 mt-6 animate-slide-up">
           <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-slate-900/10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-900 font-black">S</div>
                 <div className="text-white">
                    <p className="font-bold text-sm">Install Seconds</p>
                    <p className="text-xs text-slate-400">Better experience, instant access</p>
                 </div>
              </div>
              <button 
                onClick={handleInstallClick}
                className="bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
              >
                <Download size={14} /> Install
              </button>
           </div>
        </div>
      )}

      {/* Modules Grid */}
      <div className="px-6 mt-10">
        <h3 className="font-bold text-slate-900 mb-6 text-lg">Explore Campus</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-4">
          {enabledModules.map((mod, i) => {
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

      <SustainabilityModal isOpen={showSustainability} onClose={() => setShowSustainability(false)} user={user} />
    </div>
  );
};
