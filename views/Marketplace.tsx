import React, { useState, useEffect } from 'react';
import { Item, ModuleType, Category, College, UserProfile } from '../types';
import { ItemCard } from '../components/ItemCard';
import { Filter, ChevronLeft, Search, SlidersHorizontal, Loader2, RefreshCw, MapPin, ArrowDown, Plus, X, Check, Building2, Globe, ChevronDown, Bell, ShieldCheck, Star } from 'lucide-react';
import { api } from '../services/api';
import { DEFAULT_COLLEGE_COORDS } from '../constants';
import { useToast } from '../components/Toast';

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
  const [collegeCoords, setCollegeCoords] = useState<Record<string, { lat: number, lng: number }>>({});
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

  useEffect(() => {
    // Fetch colleges for coordinate mapping
    api.getColleges().then(colleges => {
      const mapping: Record<string, { lat: number, lng: number }> = {};
      colleges.forEach(c => {
        mapping[c.name] = { lat: c.latitude, lng: c.longitude };
      });
      setCollegeCoords(mapping);
    });
  }, []);

  useEffect(() => {
    // Reset when type, category, query, or filters change
    setPage(0);
    setHasMore(true);
    setItems([]);
    fetchItems(0);
  }, [type, selectedCategory, searchQuery, activeFilters]); 

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

      const data = await api.getItems(type, selectedCategory, searchQuery, filterParams, pageNumber, LIMIT);
      
      if (data.length < LIMIT) {
        setHasMore(false);
      }

      // Client-side sorting for "Nearest" since it depends on dynamic user location
      let resultData = data;
      if (activeFilters.sortBy === 'NEAREST' && userLocation) {
         resultData = data.sort((a, b) => {
            const coordsA = collegeCoords[a.college] || DEFAULT_COLLEGE_COORDS;
            const coordsB = collegeCoords[b.college] || DEFAULT_COLLEGE_COORDS;
            const distA = getDistance(userLocation.lat, userLocation.lng, coordsA.lat, coordsA.lng);
            const distB = getDistance(userLocation.lat, userLocation.lng, coordsB.lat, coordsB.lng);
            return distA - distB;
         });
      }

      if (pageNumber === 0) {
        setItems(resultData);
      } else {
        setItems(prev => [...prev, ...resultData]);
      }
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
    setPage(0);
    setHasMore(true);
    fetchItems(0);
  };

  const handleSaveSearch = () => {
    if (searchQuery) {
      showToast(`Alert set for "${searchQuery}"`, 'success');
    }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; 
    return d;
  }

  const deg2rad = (deg: number) => deg * (Math.PI/180);

  const getTitle = () => {
    switch(type) {
      case 'BUY': return 'Buy Items';
      case 'RENT': return 'Rent Items';
      case 'SWAP': return 'Swap Items';
      case 'EARN': return 'Find Services';
      case 'SHARE': return 'Share Resources';
      case 'REQUEST': return 'Community Requests';
      default: return type;
    }
  };

  // Count active filters (excluding college if it matches user's default)
  const isDefaultCollege = activeFilters.college === (user?.college || 'All');
  const activeCount = [
    activeFilters.minPrice, 
    activeFilters.maxPrice, 
    activeFilters.sortBy !== 'NEWEST',
    !isDefaultCollege,
    activeFilters.verifiedOnly,
    activeFilters.minRating > 0
  ].filter(Boolean).length;

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen relative">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-sm border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3 md:py-4">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full md:hidden transition-colors">
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="font-bold text-slate-800 text-xl md:text-2xl leading-none">
                  {getTitle()}
                </h1>
                <div className="flex items-center gap-1 mt-1">
                   <button 
                     onClick={() => setShowFilters(true)}
                     className="flex items-center gap-1 text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg active:scale-95 transition-all border border-primary-100 hover:bg-primary-100"
                   >
                      <Building2 size={12} />
                      {activeFilters.college === 'All' ? 'All Colleges' : activeFilters.college}
                      <ChevronDown size={12} className="opacity-50" />
                   </button>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-3">
              <div className="relative group">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"/>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in category..." 
                  className="bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-primary-200 rounded-xl pl-10 pr-12 py-2 w-64 text-sm outline-none transition-all" 
                />
                {searchQuery && (
                  <button 
                    onClick={handleSaveSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary-500 hover:bg-white rounded-lg transition-all"
                    title="Save Search Alert"
                  >
                    <Bell size={14} />
                  </button>
                )}
              </div>
              <button 
                onClick={handleRefresh}
                className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          
          <div className="border-t border-slate-50 md:border-none relative">
            <div className="flex overflow-x-auto px-4 py-3 space-x-3 no-scrollbar items-center">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all active:scale-95 ${
                  selectedCategory === 'All' 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              {Object.values(Category).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2 rounded-full text-xs md:text-sm font-medium transition-all active:scale-95 ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Visual Fade Indicator for Scrolling */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden"></div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto min-h-[60vh]">
        <div className="flex justify-between items-end mb-6">
          <p className="text-sm font-medium text-slate-500">
            Showing <span className="text-slate-900 font-bold">{loading ? '...' : items.length}</span> results
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition-all relative ${
                activeCount > 0 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal size={14} /> Filters
              {activeCount > 0 && (
                <span className="bg-white text-slate-900 w-4 h-4 rounded-full text-[10px] flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
            
            <button 
              onClick={handleRefresh}
              className={`md:hidden p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-700 ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm animate-pulse">
                <div className="aspect-square bg-slate-200 rounded-xl mb-3"></div>
                <div className="h-4 w-3/4 bg-slate-200 rounded mb-2"></div>
                <div className="h-6 w-1/4 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 mb-8">
              {items.map((item, index) => (
                <div key={item.id} className="animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${(index % LIMIT) * 50}ms` }}>
                  <ItemCard item={item} onClick={() => onItemClick && onItemClick(item)} />
                </div>
              ))}
            </div>
            
            {hasMore && (
              <div className="flex justify-center py-8">
                <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-white border border-slate-200 shadow-sm text-slate-600 px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-all disabled:opacity-70"
                >
                  {loadingMore ? <Loader2 className="animate-spin" size={18} /> : <ArrowDown size={18} />}
                  {loadingMore ? 'Loading more...' : 'Load More Items'}
                </button>
              </div>
            )}
            
            {!hasMore && items.length > LIMIT && (
               <div className="text-center py-8 text-slate-400 text-sm">
                  You've reached the end of the list.
               </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="bg-white p-6 rounded-full mb-4 shadow-sm border border-slate-100">
              <Search size={48} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No items found</h3>
            <p className="text-sm mb-6 max-w-xs text-center">
               We couldn't find matches in <span className="font-bold text-slate-900">{activeFilters.college === 'All' ? 'any college' : activeFilters.college}</span>.
            </p>
            
            {activeFilters.college !== 'All' && (
               <button 
                 onClick={handleExpandToAllColleges}
                 className="mb-4 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm"
               >
                 <Globe size={16} /> Search All Colleges
               </button>
            )}

            {activeCount > 0 && (
               <button 
                 onClick={handleClearFilters}
                 className="text-primary-600 font-bold text-sm hover:underline"
               >
                 Clear all filters
               </button>
            )}
            
            {onSellClick && !activeCount && activeFilters.college === 'All' && (
              <button 
                onClick={onSellClick}
                className="mt-4 flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
              >
                <Plus size={18} /> Sell an Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Drawer Overlay */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex justify-end">
           <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setShowFilters(false)}></div>
           
           <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-slate-900">Filters</h3>
                 <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 
                 {/* Seller Trust Section */}
                 <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Seller Reliability</h4>
                    
                    {/* Verified Only Toggle */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${filters.verifiedOnly ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                             <ShieldCheck size={18} />
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-800">Verified Sellers</p>
                             <p className="text-[10px] text-slate-500">Only ID-verified students</p>
                          </div>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={filters.verifiedOnly}
                            onChange={(e) => setFilters(prev => ({...prev, verifiedOnly: e.target.checked}))}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                       </label>
                    </div>

                    {/* Rating Selector */}
                    <div>
                       <p className="text-xs font-bold text-slate-500 mb-2">Minimum Seller Rating</p>
                       <div className="flex gap-2">
                          {[0, 3, 4, 5].map((rating) => (
                             <button
                               key={rating}
                               onClick={() => setFilters(prev => ({...prev, minRating: rating}))}
                               className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${
                                 filters.minRating === rating
                                   ? 'bg-amber-50 border-amber-200 text-amber-700' 
                                   : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                               }`}
                             >
                                {rating === 0 ? 'Any' : (
                                   <>{rating}+ <Star size={10} fill="currentColor" /></>
                                )}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <hr className="border-slate-100" />

                 {/* College Filter */}
                 <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">College Scope</h4>
                    <div className="space-y-2">
                       {user?.college && (
                         <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filters.college === user.college ? 'bg-primary-50 border-primary-200 ring-1 ring-primary-500' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-2">
                               <Building2 size={18} className={filters.college === user.college ? 'text-primary-600' : 'text-slate-400'} />
                               <span className={`text-sm font-bold ${filters.college === user.college ? 'text-primary-900' : 'text-slate-600'}`}>My College ({user.college})</span>
                            </div>
                            <input 
                              type="radio" 
                              name="college"
                              className="hidden"
                              checked={filters.college === user.college}
                              onChange={() => setFilters(prev => ({...prev, college: user.college}))}
                            />
                            {filters.college === user.college && <Check size={16} className="text-primary-600" />}
                         </label>
                       )}
                       
                       <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${filters.college === 'All' ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200'}`}>
                          <div className="flex items-center gap-2">
                             <Globe size={18} className="text-slate-400" />
                             <span className="text-sm font-bold text-slate-600">All Colleges</span>
                          </div>
                          <input 
                            type="radio" 
                            name="college"
                            className="hidden"
                            checked={filters.college === 'All'}
                            onChange={() => setFilters(prev => ({...prev, college: 'All'}))}
                          />
                          {filters.college === 'All' && <Check size={16} className="text-slate-600" />}
                       </label>
                    </div>
                 </div>

                 {/* Sort */}
                 <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Sort By</h4>
                    <div className="grid grid-cols-2 gap-3">
                       {[
                         { id: 'NEWEST', label: 'Newest First' },
                         { id: 'PRICE_ASC', label: 'Price: Low to High' },
                         { id: 'PRICE_DESC', label: 'Price: High to Low' },
                         { id: 'NEAREST', label: 'Nearest to Me' }
                       ].map(opt => (
                         <button
                           key={opt.id}
                           onClick={() => setFilters(prev => ({...prev, sortBy: opt.id as any}))}
                           className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                             filters.sortBy === opt.id 
                               ? 'bg-slate-900 text-white border-slate-900' 
                               : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                           }`}
                         >
                           {opt.label}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Price Range */}
                 <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase">Price Range</h4>
                    <div className="flex items-center gap-4">
                       <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input 
                            type="number" 
                            placeholder="Min" 
                            className="w-full pl-6 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500"
                            value={filters.minPrice}
                            onChange={(e) => setFilters(prev => ({...prev, minPrice: e.target.value}))}
                          />
                       </div>
                       <span className="text-slate-300">-</span>
                       <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                          <input 
                            type="number" 
                            placeholder="Max" 
                            className="w-full pl-6 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters(prev => ({...prev, maxPrice: e.target.value}))}
                          />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-4 bg-white pb-safe">
                 <button 
                   onClick={handleClearFilters}
                   className="flex-1 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                 >
                   Reset
                 </button>
                 <button 
                   onClick={handleApplyFilters}
                   className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                 >
                   Apply Filters
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};