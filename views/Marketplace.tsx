
import React, { useState, useEffect } from 'react';
import { Item, ModuleType, Category, College } from '../types';
import { ItemCard } from '../components/ItemCard';
import { Filter, ChevronLeft, Search, SlidersHorizontal, Loader2, RefreshCw, MapPin, ArrowDown } from 'lucide-react';
import { api } from '../services/api';
import { DEFAULT_COLLEGE_COORDS } from '../constants';
import { useToast } from '../components/Toast';

interface MarketplaceProps {
  type: ModuleType;
  onBack: () => void;
  onItemClick?: (item: Item) => void;
  initialSearchQuery?: string;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ type, onBack, onItemClick, initialSearchQuery }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortBy, setSortBy] = useState<'NEWEST' | 'NEAREST'>('NEWEST');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [collegeCoords, setCollegeCoords] = useState<Record<string, { lat: number, lng: number }>>({});
  const { showToast } = useToast();
  
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
    // Reset when type or query changes
    setPage(0);
    setHasMore(true);
    setItems([]);
    fetchItems(0);
  }, [type, selectedCategory, searchQuery]); 

  useEffect(() => {
    if (sortBy === 'NEAREST') {
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
              setSortBy('NEWEST');
            }
          );
        }
      }
    }
  }, [sortBy]);

  const fetchItems = async (pageNumber: number) => {
    if (pageNumber === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await api.getItems(type, selectedCategory, searchQuery, undefined, pageNumber, LIMIT);
      
      if (data.length < LIMIT) {
        setHasMore(false);
      }

      if (pageNumber === 0) {
        setItems(data);
      } else {
        setItems(prev => [...prev, ...data]);
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

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'NEAREST' && userLocation) {
      const coordsA = collegeCoords[a.college] || DEFAULT_COLLEGE_COORDS;
      const coordsB = collegeCoords[b.college] || DEFAULT_COLLEGE_COORDS;
      
      const distA = getDistance(userLocation.lat, userLocation.lng, coordsA.lat, coordsA.lng);
      const distB = getDistance(userLocation.lat, userLocation.lng, coordsB.lat, coordsB.lng);
      
      return distA - distB;
    }
    return 0;
  });

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

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-sm border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3 md:py-4">
            <div className="flex items-center gap-3">
              <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full md:hidden transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h1 className="font-bold text-slate-800 text-xl md:text-2xl">
                {getTitle()}
              </h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-3">
              <div className="relative group">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors"/>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in category..." 
                  className="bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-primary-200 rounded-xl pl-10 pr-4 py-2 w-64 text-sm outline-none transition-all" 
                />
              </div>
              <button 
                onClick={handleRefresh}
                className={`p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all ${refreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
          
          <div className="border-t border-slate-50 md:border-none">
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
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto min-h-[60vh]">
        <div className="flex justify-between items-end mb-6">
          <p className="text-sm font-medium text-slate-500">
            Showing <span className="text-slate-900 font-bold">{loading ? '...' : items.length}</span> results
          </p>
          <div className="flex gap-2">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium text-slate-700 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm outline-none"
            >
              <option value="NEWEST">Newest First</option>
              <option value="NEAREST">Nearest to Me</option>
            </select>
            
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
        ) : sortedItems.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 mb-8">
              {sortedItems.map((item, index) => (
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
            <p className="text-sm">Be the first to list something in this category!</p>
          </div>
        )}
      </div>
    </div>
  );
};
