
import React, { useState, useEffect } from 'react';
import { UserProfile, Item, Category } from '../types';
import { api } from '../services/api';
import { HandHeart, Users, Briefcase, MessageCircle, MapPin, Search, Plus, Filter, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { useToast } from '../components/Toast';

interface CommunityViewProps {
  user: UserProfile;
  onBack: () => void;
  onItemClick: (item: Item) => void;
  onChat: (item: Item) => void;
  onPostClick: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ user, onBack, onItemClick, onChat, onPostClick }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'REQUEST' | 'SHARE' | 'SERVICE'>('ALL');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchFeed();
  }, [activeTab]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // In a real app, this would be a single optimized query. 
      // Here we fetch multiple types and merge them client-side for the "ALL" tab.
      let data: Item[] = [];
      
      if (activeTab === 'ALL') {
        const [requests, shares, services] = await Promise.all([
          api.getItems('REQUEST', 'All'),
          api.getItems('SHARE', 'All'),
          api.getItems('SERVICE', 'All')
        ]);
        data = [...requests, ...shares, ...services].sort((a, b) => b.id.localeCompare(a.id)); // Mock sort by ID/Time
      } else {
        data = await api.getItems(activeTab, 'All');
      }
      
      setItems(data);
    } catch (e) {
      console.error(e);
      showToast("Failed to load feed", 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'REQUEST': return <HandHeart size={16} className="text-pink-500" />;
      case 'SHARE': return <Users size={16} className="text-teal-500" />;
      case 'SERVICE': return <Briefcase size={16} className="text-indigo-500" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'REQUEST': return 'Requesting';
      case 'SHARE': return 'Sharing';
      case 'SERVICE': return 'Offering Service';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REQUEST': return 'bg-pink-50 text-pink-700 border-pink-100';
      case 'SHARE': return 'bg-teal-50 text-teal-700 border-teal-100';
      case 'SERVICE': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
           <h1 className="text-xl font-black text-slate-900 tracking-tight">Community Feed</h1>
           <button 
             onClick={onPostClick}
             className="bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all active:scale-95"
           >
             <Plus size={16} /> New Post
           </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        
        {/* Search & Tabs */}
        <div className="space-y-4">
           <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-100 to-indigo-100 rounded-2xl blur opacity-30 group-focus-within:opacity-50 transition-opacity"></div>
              <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center px-4 py-3">
                 <Search size={20} className="text-slate-400 mr-3" />
                 <input 
                   type="text" 
                   placeholder="Search posts, requests, services..." 
                   className="flex-1 bg-transparent outline-none text-sm font-medium placeholder:text-slate-400"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
           </div>

           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {[
                { id: 'ALL', label: 'All Posts' },
                { id: 'REQUEST', label: 'Requests' },
                { id: 'SHARE', label: 'Free & Shared' },
                { id: 'SERVICE', label: 'Services' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    activeTab === tab.id 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
           </div>
        </div>

        {/* Feed */}
        {loading ? (
           <div className="space-y-4">
              {[1, 2, 3].map(i => (
                 <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-pulse">
                    <div className="flex gap-4 items-center mb-4">
                       <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                       <div className="flex-1 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                          <div className="h-2 bg-slate-200 rounded w-1/4"></div>
                       </div>
                    </div>
                    <div className="h-20 bg-slate-100 rounded-xl mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded-xl w-full"></div>
                 </div>
              ))}
           </div>
        ) : filteredItems.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                 <Users size={32} />
              </div>
              <p className="text-slate-500 font-medium">No posts found in this category.</p>
              <button onClick={onPostClick} className="mt-4 text-primary-600 font-bold text-sm hover:underline">
                 Be the first to post!
              </button>
           </div>
        ) : (
           <div className="space-y-4">
              {filteredItems.map((item, idx) => (
                 <div 
                   key={item.id} 
                   className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all animate-slide-up group"
                   style={{ animationDelay: `${idx * 50}ms` }}
                 >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-3">
                          <img 
                            src={`https://ui-avatars.com/api/?name=${item.sellerName}&background=random`} 
                            alt={item.sellerName}
                            className="w-10 h-10 rounded-full bg-slate-100 border border-white shadow-sm"
                          />
                          <div>
                             <h3 className="font-bold text-slate-900 text-sm">{item.sellerName}</h3>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-medium">{item.college}</span>
                                <span className="text-[10px] text-slate-300">•</span>
                                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTypeColor(item.type)}`}>
                                   {getTypeIcon(item.type)} {getTypeLabel(item.type)}
                                </div>
                             </div>
                          </div>
                       </div>
                       <button className="text-slate-300 hover:text-slate-600 p-1">
                          <MoreHorizontal size={20} />
                       </button>
                    </div>

                    {/* Content */}
                    <div 
                      onClick={() => onItemClick(item)}
                      className="cursor-pointer mb-4"
                    >
                       <h2 className="font-bold text-lg text-slate-800 mb-2 leading-tight">{item.title}</h2>
                       <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{item.description}</p>
                       
                       {item.images && item.images.length > 0 && (
                          <div className="mt-3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 max-h-64">
                             <img src={item.images[0]} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                       )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                       <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1.5 text-slate-400 hover:text-pink-500 transition-colors text-xs font-bold group/btn">
                             <Heart size={18} className="group-hover/btn:scale-110 transition-transform" /> Save
                          </button>
                          <button className="flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors text-xs font-bold">
                             <Share2 size={18} /> Share
                          </button>
                       </div>
                       
                       <button 
                         onClick={() => onChat(item)}
                         className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-2"
                       >
                          <MessageCircle size={16} /> 
                          {item.type === 'REQUEST' ? 'I have this' : item.type === 'SERVICE' ? 'Book Now' : 'Contact'}
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};
