
import React, { useState, useEffect } from 'react';
import { UserProfile, Item, Review, Badge } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Settings, LogOut, Award, ChevronRight, User, Edit2, Trash2, Eye, CheckCircle2, ShoppingBag, Clock, Repeat, Star, HelpCircle, Heart, MapPin, Inbox, XCircle } from 'lucide-react';
import { signOut } from '../services/supabaseClient';
import { api } from '../services/api';
import { EditProfileModal } from '../components/EditProfileModal';
import { getUserBadges } from '../services/badgeService';
import { BadgeIcon } from '../components/BadgeIcon';
import { WalletModal } from './WalletModal';
import { SupportModal } from '../components/SupportModal';
import { SettingsModal } from '../components/SettingsModal';
import { useToast } from '../components/Toast';

interface ProfileViewProps {
  user: UserProfile;
  onEditItem?: (item: Item) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user: initialUser, onEditItem }) => {
  const [user, setUser] = useState(initialUser); 
  const [viewMode, setViewMode] = useState<'SELLING' | 'BUYING' | 'OFFERS' | 'SAVED' | 'REVIEWS'>('SELLING');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { showToast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DRAFT' | 'SOLD'>('ACTIVE');
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [savedItems, setSavedItems] = useState<Item[]>([]);
  const [orders, setOrders] = useState<{purchases: any[], bookings: any[], swaps: any[]}>({ purchases: [], bookings: [], swaps: [] });
  const [offers, setOffers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    if (viewMode === 'SELLING') fetchUserItems();
    else if (viewMode === 'BUYING') fetchUserOrders();
    else if (viewMode === 'OFFERS') fetchIncomingOffers();
    else if (viewMode === 'REVIEWS') fetchUserReviews();
    else if (viewMode === 'SAVED') fetchSavedItems();
    
    const earnedBadges = getUserBadges(user, { averageRating: 5.0, totalSales: 5 }); 
    setBadges(earnedBadges);

  }, [user.id, viewMode]);

  const refreshProfile = async () => {
    const updated = await api.getProfile(user.id);
    if (updated) setUser(updated);
  };

  const fetchUserItems = async () => {
    setLoading(true);
    try {
      const items = await api.getUserItems(user.id);
      setUserItems(items);
    } catch (error) {
      console.error("Failed to load user items", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedItems = async () => {
    setLoading(true);
    try {
      const items = await api.getSavedItems(user.id);
      setSavedItems(items);
    } catch (error) {
      console.error("Failed to load saved items", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getUserOrders(user.id);
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomingOffers = async () => {
    setLoading(true);
    try {
      const data = await api.getIncomingOffers(user.id);
      setOffers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getReviews(user.id);
      setReviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkSold = async (item: Item) => {
    if (!window.confirm("Mark this item as sold?")) return;
    try {
      await api.updateItem(item.id, { status: 'SOLD' });
      fetchUserItems(); 
    } catch (e) {
      console.error("Error updating status", e);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm("Delete this listing permanently?")) return;
    try {
      await api.deleteItem(itemId);
      fetchUserItems();
    } catch (e) {
      console.error("Error deleting item", e);
    }
  };

  const handleRespondOffer = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.respondToProposal(id, status);
      setOffers(prev => prev.filter(o => o.id !== id));
      showToast(`Offer ${status.toLowerCase()}`, status === 'ACCEPTED' ? 'success' : 'info');
    } catch (e) {
      showToast("Failed to update offer", 'error');
    }
  };

  const filteredItems = userItems.filter(item => {
    if (activeTab === 'ACTIVE') return item.status === 'ACTIVE' || !item.status;
    return item.status === activeTab;
  });

  const data = [
    { name: 'Jan', earnings: 0 },
    { name: 'Feb', earnings: 50 },
    { name: 'Mar', earnings: 150 },
    { name: 'Apr', earnings: 100 },
    { name: 'May', earnings: user?.earnings || 0 },
  ];

  return (
    <div className="pb-24 md:pb-8 min-h-screen bg-slate-50">
      
      {/* Premium Header Banner */}
      <div className="h-48 w-full bg-gradient-to-r from-blue-600 via-primary-500 to-indigo-600 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
         <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20">
        
        {/* Profile Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[32px] p-6 md:p-8 shadow-xl border border-white/50 relative mb-8">
          
          <div className="absolute top-6 right-6 flex gap-3">
             {user.role === 'ADMIN' && (
                <div className="bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider shadow-lg">Admin</div>
             )}
             <button 
               onClick={() => setShowSettings(true)}
               className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600"
             >
               <Settings size={20} />
             </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:items-end">
             <div className="relative">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl p-1 bg-white shadow-lg rotate-3 hover:rotate-0 transition-transform duration-300">
                   <img src={user.avatar} alt="Profile" className="w-full h-full rounded-[20px] object-cover bg-slate-100" />
                </div>
                {user.verified && (
                   <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full border-4 border-white shadow-sm" title="Verified">
                      <CheckCircle2 size={18} fill="currentColor" className="text-white" />
                   </div>
                )}
             </div>
             
             <div className="flex-1 pb-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{user.name}</h1>
                <div className="flex items-center gap-2 text-slate-500 font-medium mb-4">
                   <MapPin size={16} className="text-slate-400" />
                   {user.college}
                </div>
                
                {badges.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                     {badges.map(badge => (
                       <BadgeIcon key={badge.id} badge={badge} size="sm" />
                     ))}
                  </div>
                )}
             </div>

             {/* Quick Stats */}
             <div className="flex gap-3 w-full md:w-auto">
                <div 
                  onClick={() => setShowWallet(true)}
                  className="flex-1 md:flex-none md:w-40 bg-gradient-to-br from-primary-50 to-white p-4 rounded-2xl border border-primary-100 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                     <p className="text-primary-600 text-[10px] font-bold uppercase tracking-wider">Earnings</p>
                     <ChevronRight size={14} className="text-primary-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-2xl font-black text-slate-800">${user.earnings?.toLocaleString() || 0}</p>
                </div>
                
                <div className="flex-1 md:flex-none md:w-40 bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-100">
                  <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-1">Impact</p>
                  <p className="text-2xl font-black text-slate-800">{user.savings || 0} <span className="text-xs font-bold text-slate-400">pts</span></p>
                </div>
             </div>
          </div>
        </div>

        {/* Floating Tab Navigation */}
        <div className="flex justify-center mb-8 sticky top-20 z-20 overflow-x-auto no-scrollbar py-2">
           <div className="glass p-1.5 rounded-2xl flex gap-1 shadow-lg shadow-slate-200/50 whitespace-nowrap">
              {(['SELLING', 'BUYING', 'OFFERS', 'SAVED', 'REVIEWS'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`
                    relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                    ${viewMode === mode ? 'text-white shadow-md bg-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'}
                  `}
                >
                  {mode.charAt(0) + mode.slice(1).toLowerCase()}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {viewMode === 'SELLING' ? (
              <>
                {/* Chart Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                       <Clock size={18} className="text-primary-500" /> Activity
                    </h3>
                  </div>
                  <div className="h-64 w-full">
                    <div className="h-full w-full min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f1f5f9', radius: 4 }}
                          />
                          <Bar dataKey="earnings" radius={[6, 6, 0, 0]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#0ea5e9' : '#cbd5e1'} />
                              ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Listings List */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[300px]">
                  <div className="p-2 border-b border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
                     {(['ACTIVE', 'DRAFT', 'SOLD'] as const).map((tab) => (
                        <button
                           key={tab}
                           onClick={() => setActiveTab(tab)}
                           className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors ${activeTab === tab ? 'bg-slate-50 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           {tab}
                        </button>
                     ))}
                  </div>
                  
                  <div className="divide-y divide-slate-50">
                    {loading ? (
                      <div className="p-12 text-center text-slate-400">Loading...</div>
                    ) : filteredItems.length > 0 ? (
                      filteredItems.map((item, idx) => (
                        <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                          <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shrink-0 border border-slate-100">
                            {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                            <p className="text-primary-600 font-bold text-lg">${item.price}</p>
                            <p className="text-xs text-slate-400 mt-1">{item.category} • {new Date().toLocaleDateString()}</p>
                          </div>

                          <div className="flex gap-2">
                            {activeTab === 'ACTIVE' && (
                              <button onClick={() => handleMarkSold(item)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors" title="Mark Sold">
                                <CheckCircle2 size={18} />
                              </button>
                            )}
                            {(activeTab === 'ACTIVE' || activeTab === 'DRAFT') && (
                              <button onClick={() => onEditItem && onEditItem(item)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Edit">
                                <Edit2 size={18} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors" title="Delete">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                           <ShoppingBag size={24} />
                        </div>
                        <p className="text-slate-500 text-sm font-medium">No {activeTab.toLowerCase()} listings.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : viewMode === 'BUYING' ? (
               <div className="space-y-6 animate-fade-in">
                 {/* Purchases */}
                 <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                       <ShoppingBag size={20} className="text-blue-500"/> Purchases
                    </h3>
                    <div className="space-y-4">
                       {orders.purchases.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">No purchases yet.</p> : 
                          orders.purchases.map(p => (
                             <div key={p.id} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm">
                                   {p.item?.image && <img src={JSON.parse(p.item.image)[0]} className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                   <p className="font-bold text-slate-900 text-sm">{p.item?.title}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg">{p.status}</span>
                                      <span className="text-xs font-medium text-slate-500">${p.amount}</span>
                                   </div>
                                </div>
                             </div>
                          ))
                       }
                    </div>
                 </div>
               </div>
            ) : viewMode === 'OFFERS' ? (
               <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 animate-fade-in">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Inbox size={20} className="text-purple-500"/> Incoming Offers
                  </h3>
                  <div className="space-y-4">
                     {offers.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">No open offers received.</p> : 
                        offers.map(offer => (
                           <div key={offer.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                 <img src={offer.initiator?.avatar_url || `https://ui-avatars.com/api/?name=${offer.initiator?.full_name}`} className="w-10 h-10 rounded-full" />
                                 <div>
                                    <p className="font-bold text-slate-900 text-sm">{offer.initiator?.full_name} <span className="text-slate-500 font-normal">offered to trade for</span></p>
                                    <p className="text-xs font-bold text-primary-600">{offer.targetItem?.title}</p>
                                 </div>
                              </div>
                              
                              <div className="bg-slate-50 p-3 rounded-xl flex gap-3 border border-slate-100">
                                 <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                    {offer.offeredItem?.image && <img src={JSON.parse(offer.offeredItem.image)[0]} className="w-full h-full object-cover" />}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-800 text-sm">{offer.offeredItem?.title}</p>
                                    <p className="text-xs text-slate-500">Value: ${offer.offeredItem?.price}</p>
                                 </div>
                              </div>

                              <div className="flex gap-2 mt-2">
                                 <button 
                                   onClick={() => handleRespondOffer(offer.id, 'ACCEPTED')}
                                   className="flex-1 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-colors"
                                 >
                                   Accept
                                 </button>
                                 <button 
                                   onClick={() => handleRespondOffer(offer.id, 'REJECTED')}
                                   className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                                 >
                                   Reject
                                 </button>
                              </div>
                           </div>
                        ))
                     }
                  </div>
               </div>
            ) : viewMode === 'SAVED' ? (
               <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 animate-fade-in">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Heart size={20} className="text-red-500"/> Saved Items
                  </h3>
                  <div className="space-y-4">
                     {savedItems.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">Your wishlist is empty.</p> : 
                        savedItems.map(item => (
                           <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group" onClick={() => onEditItem && onEditItem(item)}>
                              <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
                                 {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                              </div>
                              <div className="flex-1">
                                 <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{item.title}</h4>
                                 <p className="text-sm font-medium text-slate-500">${item.price}</p>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                                 <ChevronRight size={16} />
                              </div>
                           </div>
                        ))
                     }
                  </div>
               </div>
            ) : (
               <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 animate-fade-in">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                     <Star size={20} className="text-amber-500"/> Reviews
                  </h3>
                  <div className="space-y-6">
                     {reviews.length === 0 ? <p className="text-slate-400 text-sm text-center py-8">No reviews yet.</p> :
                        reviews.map(r => (
                           <div key={r.id} className="border-b border-slate-50 last:border-0 pb-6 last:pb-0">
                              <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center gap-2">
                                    <img src={r.reviewerAvatar || `https://ui-avatars.com/api/?name=${r.reviewerName}`} className="w-8 h-8 rounded-full bg-slate-100" />
                                    <span className="font-bold text-slate-900 text-sm">{r.reviewerName}</span>
                                 </div>
                                 <div className="flex text-amber-400">
                                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                                 </div>
                              </div>
                              <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-xl rounded-tl-none">"{r.comment}"</p>
                              <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(r.createdAt).toLocaleDateString()}</p>
                           </div>
                        ))
                     }
                  </div>
               </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-50">
                   <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Account</h3>
                </div>
                <div>
                   {[
                     { icon: User, label: "Edit Profile", onClick: () => setShowEditProfile(true) },
                     { icon: Award, label: "My Badges", value: `${badges.length}`, onClick: () => {} },
                     { icon: Settings, label: "Preferences", onClick: () => setShowSettings(true) },
                   ].map((item, i) => (
                     <button key={i} onClick={item.onClick} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                              <item.icon size={18} />
                           </div>
                           <span className="font-bold text-sm text-slate-700">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           {item.value && <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg">{item.value}</span>}
                           <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500" />
                        </div>
                     </button>
                   ))}
                </div>
             </div>

             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-50">
                   <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Support</h3>
                </div>
                <div>
                   <button onClick={() => setShowSupport(true)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <HelpCircle size={18} />
                         </div>
                         <span className="font-bold text-sm text-slate-700">Help Center</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-primary-500" />
                   </button>
                   <button onClick={signOut} className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors group border-t border-slate-50">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-50 rounded-xl text-red-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                            <LogOut size={18} />
                         </div>
                         <span className="font-bold text-sm text-red-600">Sign Out</span>
                      </div>
                   </button>
                </div>
             </div>
          </div>

        </div>
      </div>
      
      <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} user={user} onUpdate={refreshProfile} />
      <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} user={user} onUpdate={refreshProfile} />
      <SupportModal isOpen={showSupport} onClose={() => setShowSupport(false)} userId={user.id} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} userEmail={user.email} />
    </div>
  );
};
