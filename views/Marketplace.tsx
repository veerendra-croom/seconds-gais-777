
import React, { useState, useEffect } from 'react';
import { Item, ModuleType, Category, College, UserProfile } from '../types';
import { ItemCard } from '../components/ItemCard';
import { Filter, ChevronLeft, Search, SlidersHorizontal, Loader2, RefreshCw, MapPin, ArrowDown, Plus, X, Check, Building2, Globe, ChevronDown, Bell, ShieldCheck, Star, ShoppingBag, Clock, Repeat, Briefcase, HandHeart, Users, List, Map as MapIcon, ArrowUp, Sparkles, BookOpen, Monitor, Coffee, Bike } from 'lucide-react';
import { api } from '../services/api';
import { DEFAULT_COLLEGE_COORDS } from '../constants';
import { useToast } from '../components/Toast';
import { parseSearchQuery } from '../services/geminiService';

interface MarketplaceProps {
  type: ModuleType;
  onBack: () => void;
  onItemClick?: (item: Item) => void;
  initialSearchQuery?: string;
  onSellClick?: () => void;
  user: UserProfile | null;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ type, onBack, onItemClick, initialSearchQuery, onSellClick, user }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');
  const [newItemsCount, setNewItemsCount] = useState(0);
  const { showToast } = useToast();
  
  // Filter & Sort State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    sortBy: 'NEWEST' as 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEAREST',
    college: user?.college || 'All', // Default to user college
    verifiedOnly: false,
    minRating: 0
  });
  // Active filters applied to API
  const [activeFilters, setActiveFilters] = useState(filters);

  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 12;

  // Handle Initial Search (from Home) with AI Parsing
  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery.split(' ').length > 2) {
       performSmartSearch(initialSearchQuery);
    } else {
       fetchItems(0);
    }
  }, [type]); // Run on mount or type change

  // Standard Refetch on Filter Changes
  useEffect(() => {
    // Only refetch if NOT currently processing a smart search to avoid double fetch
    if (!isSmartSearching) {
      setPage(0);
      setHasMore(true);
      setItems([]);
      setNewItemsCount(0);
      fetchItems(0);
    }
  }, [selectedCategory, activeFilters]); 

  // Realtime Item Listener
  useEffect(() => {
    if (activeFilters.college !== 'All' && activeFilters.college) {
       const subscription = api.subscribeToNewItems(activeFilters.college, () => {
          setNewItemsCount(prev => prev + 1);
       });
       return () => { subscription.unsubscribe(); }
    }
  }, [activeFilters.college]);

  const performSmartSearch = async (query: string) => {
    setIsSmartSearching(true);
    setLoading(true);
    try {
      const parsed = await parseSearchQuery(query);
      if (parsed) {
        // Apply AI suggested filters
        const newFilters = { ...filters };
        if (parsed.minPrice) newFilters.minPrice = parsed.minPrice.toString();
        if (parsed.maxPrice) newFilters.maxPrice = parsed.maxPrice.toString();
        if (parsed.sortBy) newFilters.sortBy = parsed.sortBy;
        
        setFilters(newFilters);
        setActiveFilters(newFilters);
        
        if (parsed.category) setSelectedCategory(parsed.category as Category);
        if (parsed.searchQuery) setSearchQuery(parsed.searchQuery);
        
        showToast("Smart filters applied!", 'success');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSmartSearching(false);
      // Fetch will be triggered by activeFilters change
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchQuery.split(' ').length >= 3) {
         performSmartSearch(searchQuery);
      } else {
         setPage(0);
         setItems([]);
         fetchItems(0);
      }
    }
  };

  // Quick Collections Handler
  const handleQuickCollection = (collection: any) => {
     setFilters(prev => ({ 
        ...prev, 
        minPrice: collection.minPrice || '', 
        maxPrice: collection.maxPrice || '',
        verifiedOnly: collection.verifiedOnly || false
     }));
     setActiveFilters(prev => ({ 
        ...prev, 
        minPrice: collection.minPrice || '', 
        maxPrice: collection.maxPrice || '',
        verifiedOnly: collection.verifiedOnly || false
     }));
     
     if (collection.category) setSelectedCategory(collection.category);
     if (collection.query) setSearchQuery(collection.query);
     else setSearchQuery('');
  };

  useEffect(() => {
    if (activeFilters.sortBy === 'NEAREST') {
      if (!userLocation) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
            },
            (error) => {
              console.error("Geo error", error);
              showToast("Could not access location. Sorting by newest.", 'error');
              setFilters(prev => ({...prev, sortBy: 'NEWEST'}));
              setActiveFilters(prev => ({...prev, sortBy: 'NEWEST'}));
            }
          );
        }
      }
    }
  }, [activeFilters.sortBy]);

  useEffect(() => {
    if (viewMode === 'MAP' && !loading && items.length > 0) {
       const initMap = async () => {
          const L = (window as any).L;
          if (!L || !document.getElementById('marketplace-map')) return;

          const container = L.DomUtil.get('marketplace-map');
          if(container != null) container._leaflet_id = null;

          // Determine Center: If college filter active, Geocode it. Else fallback.
          let center = DEFAULT_COLLEGE_COORDS;
          const targetCollege = activeFilters.college !== 'All' ? activeFilters.college : items[0]?.college;
          
          if (targetCollege) {
             const coords = await api.getCoordinates(targetCollege);
             if (coords) center = coords;
          }

          const map = L.map('marketplace-map', {
             center: [center.lat, center.lng],
             zoom: 14,
             zoomControl: false
          });

          L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
             maxZoom: 19
          }).addTo(map);

          items.forEach((item) => {
             // Only display items with valid coordinates
             if (item.latitude && item.longitude) {
                const icon = L.divIcon({
                    className: 'custom-map-marker',
                    html: `<div style="background-image: url(${item.image}); width: 40px; height: 40px; background-size: cover; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                });

                const marker = L.marker([item.latitude, item.longitude], { icon }).addTo(map);
                marker.bindPopup(`
                    <div style="text-align: center;">
                    <p style="font-weight: bold; margin-bottom: 4px;">${item.title}</p>
                    <p style="color: #0ea5e9; font-weight: bold;">$${item.price}</p>
                    </div>
                `);
                marker.on('click', () => onItemClick && onItemClick(item));
             }
          });
       };
       initMap();
    }
  }, [viewMode, items, loading]);

  const fetchItems = async (pageNumber: number) => {
    if (pageNumber === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const filterParams = {
        minPrice: activeFilters.minPrice ? parseFloat(activeFilters.minPrice) : undefined,
        maxPrice: activeFilters.maxPrice ? parseFloat(activeFilters.maxPrice) : undefined,
        sortBy: activeFilters.sortBy,
        college: activeFilters.college,
        verifiedOnly: activeFilters.verifiedOnly,
        minRating: activeFilters.minRating
      };

      const fetchLimit = viewMode === 'MAP' && pageNumber === 0 ? 50 : LIMIT;
      const data = await api.getItems(type, selectedCategory, searchQuery, filterParams, pageNumber, fetchLimit);
      
      if (data.length < LIMIT) setHasMore(false);

      if (pageNumber === 0) setItems(data);
      else setItems(prev => [...prev, ...data]);

    } catch (error) {
      console.error("Failed to fetch items", error);
      showToast("Failed to load items", 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleApplyFilters = () => {
    setActiveFilters(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const reset = { 
      minPrice: '', 
      maxPrice: '', 
      sortBy: 'NEWEST' as const, 
      college: user?.college || 'All',
      verifiedOnly: false,
      minRating: 0
    };
    setFilters(reset);
    setActiveFilters(reset);
    setShowFilters(false);
  };

  const handleExpandToAllColleges = () => {
    const newFilters = { ...filters, college: 'All' };
    setFilters(newFilters);
    setActiveFilters(newFilters);
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setNewItemsCount(0);
    setPage(0);
    setHasMore(true);
    fetchItems(0);
  };

  const handleSaveSearch = () => {
    if (searchQuery) showToast(`Alert set for "${searchQuery}"`, 'success');
  };

  // Theme configuration for each module
  const getTheme = () => {
    switch(type) {
      case 'BUY': return { title: 'Buy & Sell', subtitle: 'Find great deals on campus essentials.', icon: ShoppingBag, bg: 'from-blue-600 to-blue-400', pattern: "url('https://www.transparenttextures.com/patterns/cubes.png')" };
      case 'RENT': return { title: 'Rentals', subtitle: 'Borrow what you need for a fraction of the cost.', icon: Clock, bg: 'from-orange-500 to-amber-400', pattern: "url('https://www.transparenttextures.com/patterns/diagmonds-light.png')" };
      case 'SHARE': return { title: 'Community Share', subtitle: 'Free or low-cost resources for students.', icon: Users, bg: 'from-teal-500 to-emerald-400', pattern: "url('https://www.transparenttextures.com/patterns/food.png')" };
      case 'SWAP': return { title: 'Trading Post', subtitle: 'Swap items you don\'t need for ones you do.', icon: Repeat, bg: 'from-purple-600 to-indigo-500', pattern: "url('https://www.transparenttextures.com/patterns/cross-stripes.png')" };
      case 'EARN': return { title: 'Campus Services', subtitle: 'Hire students for tutoring, moving, and more.', icon: Briefcase, bg: 'from-rose-500 to-pink-500', pattern: "url('https://www.transparenttextures.com/patterns/arches.png')" };
      case 'REQUEST': return { title: 'Wishlist', subtitle: 'Post what you need and let others fulfill it.', icon: HandHeart, bg: 'from-indigo-600 to-blue-500', pattern: "url('https://www.transparenttextures.com/patterns/always-grey.png')" };
      default: return { title: 'Marketplace', subtitle: 'Explore the campus economy.', icon: ShoppingBag, bg: 'from-slate-800 to-slate-600', pattern: "" };
    }
  };

  const theme = getTheme();
  const ThemeIcon = theme.icon;
  const isDefaultCollege = activeFilters.college === (user?.college || 'All');
  const activeCount = [activeFilters.minPrice, activeFilters.maxPrice, activeFilters.sortBy !== 'NEWEST', !isDefaultCollege, activeFilters.verifiedOnly, activeFilters.minRating > 0].filter(Boolean).length;

  const quickCollections = [
     { label: 'Under $25', icon: <ShoppingBag size={14}/>, maxPrice: '25' },
     { label: 'Textbooks', icon: <BookOpen size={14}/>, category: Category.BOOKS },
     { label: 'Apple Gear', icon: <Monitor size={14}/>, category: Category.ELECTRONICS, query: 'Apple' },
     { label: 'Verified', icon: <ShieldCheck size={14}/>, verifiedOnly: true },
     { label: 'Mobility', icon: <Bike size={14}/>, category: Category.VEHICLES },
     { label: 'Furniture', icon: <Coffee size={14}/>, category: Category.FURNITURE },
  ];

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen relative">
      {/* New Items Alert */}
      {newItemsCount > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
           <button onClick={handleRefresh} className="bg-blue-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-transform active:scale-95">
              <ArrowUp size={14} /> New Items Available ({newItemsCount})
           </button>
        </div>
      )}

      {/* Dynamic Hero Header */}
      <div className={`relative bg-gradient-to-r ${theme.bg} pt-4 pb-16 md:pb-20 overflow-hidden shadow-lg transition-all duration-500`}>
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: theme.pattern }}></div>
         <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
         <div className="absolute top-0 left-0 w-32 h-32 bg-black/5 rounded-full blur-2xl"></div>

         <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex items-center justify-between mb-4">
               <button onClick={onBack} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white backdrop-blur-md transition-colors">
                  <ChevronLeft size={24} />
               </button>
               {onSellClick && (
                 <button onClick={onSellClick} className="flex items-center gap-2 bg-white/90 text-slate-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-white transition-transform active:scale-95 hover:scale-105">
                   <Plus size={16} /> Post {type === 'REQUEST' ? 'Request' : type === 'EARN' ? 'Service' : 'Item'}
                 </button>
               )}
            </div>
            
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/30 shadow-inner">
                  <ThemeIcon size={32} />
               </div>
               <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none mb-1 shadow-black/5 drop-shadow-sm">{theme.title}</h1>
                  <p className="text-white/80 font-medium text-sm md:text-base max-w-md leading-snug">{theme.subtitle}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
         {/* Search & Filter Bar */}
         <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-2 md:p-3 flex flex-col md:flex-row gap-3 items-center border border-slate-100">
            <div className="relative flex-1 w-full">
               {isSmartSearching ? (
                 <Sparkles size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 animate-pulse" />
               ) : (
                 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               )}
               <input 
                 type="text" 
                 value={searchQuery}
                 onKeyDown={handleSearchKeyDown}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder={`Search ${type.toLowerCase()}...`}
                 className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-transparent focus:border-primary-200 rounded-xl pl-11 pr-10 py-3 text-sm outline-none transition-all placeholder:text-slate-400 font-medium"
               />
               {searchQuery && (
                  <button onClick={handleSaveSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-500 transition-colors">
                     <Bell size={16} />
                  </button>
               )}
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
               <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setViewMode('LIST')} className={`p-2 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}><List size={18} /></button>
                  <button onClick={() => setViewMode('MAP')} className={`p-2 rounded-lg transition-all ${viewMode === 'MAP' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}><MapIcon size={18} /></button>
               </div>

               <button onClick={() => setShowFilters(true)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all border ${activeCount > 0 ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                 <SlidersHorizontal size={16} /> Filters
                 {activeCount > 0 && <span className="bg-white text-slate-900 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{activeCount}</span>}
               </button>
               <button onClick={handleRefresh} className={`p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all ${refreshing ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
            </div>
         </div>

         {/* Quick Collections (Chips) */}
         <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2 mask-linear-fade">
            {quickCollections.map((col, idx) => (
               <button 
                 key={idx}
                 onClick={() => handleQuickCollection(col)}
                 className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all whitespace-nowrap shadow-sm active:scale-95"
               >
                  {col.icon} {col.label}
               </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="mt-6 min-h-[50vh]">
            <div className="flex justify-between items-end mb-4">
               <p className="text-sm font-medium text-slate-500">Showing <span className="text-slate-900 font-bold">{loading ? '...' : items.length}</span> results</p>
               <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">
                  <MapPin size={12} /> {activeFilters.college === 'All' ? 'All Colleges' : activeFilters.college}
               </div>
            </div>

            {viewMode === 'MAP' ? (
               <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-[600px] relative animate-fade-in">
                  <div id="marketplace-map" className="w-full h-full bg-slate-100"></div>
                  {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-[400]"><Loader2 className="animate-spin text-primary-500" size={32} /></div>}
               </div>
            ) : (
               <>
                  {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm animate-pulse h-64"></div>)}
                    </div>
                  ) : items.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {items.map((item, index) => (
                          <div key={item.id} className="animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${(index % LIMIT) * 50}ms` }}>
                            <ItemCard item={item} onClick={() => onItemClick && onItemClick(item)} />
                          </div>
                        ))}
                      </div>
                      {hasMore && (
                        <div className="flex justify-center py-12">
                          <button onClick={handleLoadMore} disabled={loadingMore} className="bg-white border border-slate-200 shadow-sm text-slate-600 px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-slate-50 hover:shadow-md transition-all disabled:opacity-70 active:scale-95">
                            {loadingMore ? <Loader2 className="animate-spin" size={18} /> : <ArrowDown size={18} />}
                            {loadingMore ? 'Loading more...' : 'Load More Items'}
                          </button>
                        </div>
                      )}
                      {!hasMore && items.length > LIMIT && <div className="text-center py-12 text-slate-400 text-sm font-medium">You've reached the end of the list.</div>}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-3xl border border-slate-100 border-dashed">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Search size={32} className="text-slate-300" /></div>
                      <h3 className="text-lg font-bold text-slate-700">No items found</h3>
                      <p className="text-sm mb-6 max-w-xs text-center text-slate-500">We couldn't find matches in <span className="font-bold text-slate-900">{activeFilters.college === 'All' ? 'any college' : activeFilters.college}</span>.</p>
                      {activeFilters.college !== 'All' && (
                         <button onClick={handleExpandToAllColleges} className="mb-4 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm"><Globe size={16} /> Search All Colleges</button>
                      )}
                      {activeCount > 0 && <button onClick={handleClearFilters} className="text-slate-500 font-bold text-xs hover:text-slate-800 underline">Clear filters</button>}
                    </div>
                  )}
               </>
            )}
         </div>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={() => setShowFilters(false)}></div>
           <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <h3 className="font-bold text-lg text-slate-900">Filters</h3>
                 <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 {/* Filters UI */}
                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Seller Reliability</h4>
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${filters.verifiedOnly ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}><ShieldCheck size={18} /></div>
                          <div><p className="text-sm font-bold text-slate-800">Verified Sellers</p><p className="text-[10px] text-slate-500">Only ID-verified students</p></div>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={filters.verifiedOnly} onChange={(e) => setFilters(prev => ({...prev, verifiedOnly: e.target.checked}))} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                       </label>
                    </div>
                    <div>
                       <p className="text-xs font-bold text-slate-500 mb-2">Minimum Seller Rating</p>
                       <div className="flex gap-2">
                          {[0, 3, 4, 5].map((rating) => (
                             <button key={rating} onClick={() => setFilters(prev => ({...prev, minRating: rating}))} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${filters.minRating === rating ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>{rating === 0 ? 'Any' : <>{rating}+ <Star size={10} fill="currentColor" /></>}</button>
                          ))}
                       </div>
                    </div>
                 </div>
                 <hr className="border-slate-100" />
                 <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">College Scope</h4>
                    <div className="space-y-2">
                       {user?.college && (
                         <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filters.college === user.college ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-500' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-2"><Building2 size={18} className={filters.college === user.college ? 'text-primary-600' : 'text-slate-400'} /><span className={`text-sm font-bold ${filters.college === user.college ? 'text-primary-900' : 'text-slate-600'}`}>My College ({user.college})</span></div>
                            <input type="radio" name="college" className="hidden" checked={filters.college === user.college} onChange={() => setFilters(prev => ({...prev, college: user.college}))} />
                            {filters.college === user.college && <Check size={16} className="text-primary-600" />}
                         </label>
                       )}
                       <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filters.college === 'All' ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center gap-2"><Globe size={18} className="text-slate-400" /><span className="text-sm font-bold text-slate-600">All Colleges</span></div>
                          <input type="radio" name="college" className="hidden" checked={filters.college === 'All'} onChange={() => setFilters(prev => ({...prev, college: 'All'}))} />
                          {filters.college === 'All' && <Check size={16} className="text-slate-600" />}
                       </label>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Sort By</h4>
                    <div className="grid grid-cols-2 gap-3">
                       {[
                         { id: 'NEWEST', label: 'Newest First' },
                         { id: 'PRICE_ASC', label: 'Price: Low to High' },
                         { id: 'PRICE_DESC', label: 'Price: High to Low' },
                         { id: 'NEAREST', label: 'Nearest to Me' }
                       ].map(opt => (
                         <button key={opt.id} onClick={() => setFilters(prev => ({...prev, sortBy: opt.id as any}))} className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${filters.sortBy === opt.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>{opt.label}</button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Price Range</h4>
                    <div className="flex items-center gap-4">
                       <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input type="number" placeholder="Min" className="w-full pl-6 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500" value={filters.minPrice} onChange={(e) => setFilters(prev => ({...prev, minPrice: e.target.value}))} />
                       </div>
                       <span className="text-slate-300">-</span>
                       <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input type="number" placeholder="Max" className="w-full pl-6 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500" value={filters.maxPrice} onChange={(e) => setFilters(prev => ({...prev, maxPrice: e.target.value}))} />
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex gap-4 bg-white pb-safe">
                 <button onClick={handleClearFilters} className="flex-1 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors">Reset</button>
                 <button onClick={handleApplyFilters} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95">Apply Filters</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
