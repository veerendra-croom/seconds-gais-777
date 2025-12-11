
import React, { useEffect, useState } from 'react';
import { UserProfile, Item } from '../types';
import { api } from '../services/api';
import { generateSellerTips } from '../services/geminiService';
import { ChevronLeft, TrendingUp, Eye, Heart, ShoppingBag, Plus, MoreHorizontal, CheckCircle2, AlertCircle, BarChart3, ArrowUpRight, ArrowDownRight, Edit2, Trash2, Sparkles, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useToast } from '../components/Toast';

interface SellerDashboardViewProps {
  user: UserProfile;
  onBack: () => void;
  onEditItem: (item: Item) => void;
}

export const SellerDashboardView: React.FC<SellerDashboardViewProps> = ({ user, onBack, onEditItem }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState({ views: 0, likes: 0, sales: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [sellerTips, setSellerTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const fetchDashboardData = async () => {
    try {
      const userItems = await api.getUserItems(user.id);
      setItems(userItems);

      // Real Analytics Calculation
      let totalViews = 0;
      const sales = userItems.filter(i => i.status === 'SOLD').length;
      const active = userItems.filter(i => i.status === 'ACTIVE').length;

      // Calculate Total Likes using new API
      const totalLikes = await api.getSellerTotalLikes(user.id);

      userItems.forEach(item => {
         totalViews += item.views || 0;
      });

      setStats({ views: totalViews, likes: totalLikes, sales, active });

      // Calculate Real Revenue History
      const earningsHistory = await api.getUserEarningsHistory(user.id);
      
      // If history exists, map it to chart, else show flat line
      if (earningsHistory.length > 0) {
         setChartData(earningsHistory.map(h => ({ name: h.name, views: h.earnings, clicks: 0 })));
      } else {
         const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
         setChartData(days.map(d => ({ name: d, views: 0, clicks: 0 })));
      }

      // Generate AI Tips if there are active items
      const activeItems = userItems.filter(i => i.status === 'ACTIVE');
      if (activeItems.length > 0) {
         setTipsLoading(true);
         generateSellerTips(activeItems.map(i => i.title)).then(tips => {
            setSellerTips(tips);
            setTipsLoading(false);
         });
      }

    } catch (e) {
      console.error(e);
      showToast("Failed to load dashboard", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Permanently delete this listing?")) return;
    try {
      await api.deleteItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
      showToast("Item deleted", 'success');
    } catch (e) {
      showToast("Failed to delete", 'error');
    }
  };

  const handleMarkSold = async (item: Item) => {
    try {
      await api.updateItem(item.id, { status: 'SOLD' });
      fetchDashboardData(); // Refresh to update stats
      showToast("Marked as sold", 'success');
    } catch (e) {
      showToast("Update failed", 'error');
    }
  };

  const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-32">
       <div className="flex justify-between items-start">
          <div className={`p-2 rounded-xl ${color.bg} ${color.text}`}>
             <Icon size={20} />
          </div>
          {trend && (
             <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={12} /> {trend}%
             </div>
          )}
       </div>
       <div>
          <h4 className="text-2xl font-black text-slate-800">{value}</h4>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
               <ChevronLeft size={24} />
            </button>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Seller Dashboard</h1>
         </div>
         <button 
           onClick={() => onEditItem({} as Item)}
           className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95"
         >
            <Plus size={16} /> New Listing
         </button>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
         
         {/* Stats Grid */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              label="Total Revenue" 
              value={`$${user.earnings?.toLocaleString() || 0}`} 
              icon={TrendingUp} 
              color={{ bg: 'bg-green-50', text: 'text-green-600' }}
            />
            <StatCard 
              label="Active Listings" 
              value={stats.active} 
              icon={ShoppingBag} 
              color={{ bg: 'bg-blue-50', text: 'text-blue-600' }} 
            />
            <StatCard 
              label="Wishlisted" 
              value={stats.likes} 
              icon={Heart} 
              color={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
            />
            <StatCard 
              label="Completed Sales" 
              value={stats.sales} 
              icon={CheckCircle2} 
              color={{ bg: 'bg-pink-50', text: 'text-pink-600' }} 
            />
         </div>

         {/* Chart Section */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-80 flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                     <BarChart3 size={20} className="text-indigo-500" /> Revenue Insights
                  </h3>
               </div>
               <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData}>
                        <defs>
                           <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* AI Coach */}
            <div className="bg-gradient-to-br from-indigo-900 to-violet-900 p-6 rounded-3xl text-white flex flex-col shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="p-2 bg-white/10 rounded-lg">
                        <Sparkles size={20} className="text-yellow-300" />
                     </div>
                     <h3 className="font-bold text-lg">AI Selling Coach</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                     {tipsLoading ? (
                        <p className="text-white/60 text-sm animate-pulse">Analyzing market trends...</p>
                     ) : sellerTips.length > 0 ? (
                        sellerTips.map((tip, idx) => (
                           <div key={idx} className="bg-white/10 p-3 rounded-xl border border-white/5 text-xs text-white/90 leading-relaxed flex gap-2">
                              <Zap size={14} className="shrink-0 text-yellow-300 mt-0.5" />
                              {tip}
                           </div>
                        ))
                     ) : (
                        <p className="text-white/60 text-sm">List more items to get personalized AI advice based on your inventory!</p>
                     )}
                  </div>

                  <button onClick={() => onEditItem({} as Item)} className="bg-white text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors mt-4 w-full shadow-lg">
                     Create New Listing
                  </button>
               </div>
            </div>
         </div>

         {/* Inventory List */}
         <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="font-bold text-lg text-slate-800">Inventory</h3>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{items.length} Items</div>
            </div>
            
            {loading ? (
               <div className="p-12 text-center text-slate-400">Loading inventory...</div>
            ) : items.length === 0 ? (
               <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                     <ShoppingBag size={24} />
                  </div>
                  <p className="text-slate-500">No items listed yet.</p>
               </div>
            ) : (
               <div className="divide-y divide-slate-50">
                  {items.map(item => (
                     <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                        <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100 relative">
                           <img src={item.image} className={`w-full h-full object-cover ${item.status === 'SOLD' ? 'grayscale' : ''}`} />
                           {item.status === 'SOLD' && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                 <span className="text-[8px] font-black text-white bg-red-500 px-1 rounded uppercase">Sold</span>
                              </div>
                           )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900 truncate">{item.title}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                 item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                 item.status === 'SOLD' ? 'bg-slate-200 text-slate-600' :
                                 'bg-amber-100 text-amber-700'
                              }`}>
                                 {item.status}
                              </span>
                           </div>
                           <p className="text-sm font-bold text-slate-500 mb-1">${item.price}</p>
                           <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><Eye size={12}/> {item.views || 0}</span>
                           </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           {item.status === 'ACTIVE' && (
                              <button onClick={() => handleMarkSold(item)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Mark Sold">
                                 <CheckCircle2 size={18} />
                              </button>
                           )}
                           <button onClick={() => onEditItem(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Edit">
                              <Edit2 size={18} />
                           </button>
                           <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                              <Trash2 size={18} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
