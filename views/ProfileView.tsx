import React, { useState, useEffect } from 'react';
import { UserProfile, Item } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Settings, LogOut, Award, ChevronRight, User, Edit2, Trash2, Eye, CheckCircle2 } from 'lucide-react';
import { signOut } from '../services/supabaseClient';
import { api } from '../services/api';

interface ProfileViewProps {
  user: UserProfile;
  onEditItem?: (item: Item) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onEditItem }) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DRAFT' | 'SOLD'>('ACTIVE');
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    fetchUserItems();
  }, [user.id]);

  const fetchUserItems = async () => {
    setLoadingItems(true);
    try {
      const items = await api.getUserItems(user.id);
      setUserItems(items);
    } catch (error) {
      console.error("Failed to load user items", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleMarkSold = async (item: Item) => {
    if (!window.confirm("Mark this item as sold?")) return;
    try {
      await api.updateItem(item.id, { status: 'SOLD' });
      fetchUserItems(); // Refresh list
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
    <div className="pb-24 md:pb-8 min-h-screen bg-slate-50 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-b-3xl md:rounded-2xl shadow-sm border-slate-200 md:border">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-xl font-bold md:text-2xl">My Profile</h1>
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <Settings className="text-slate-400" size={24} />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center space-x-4">
              <img src={user.avatar} alt="Profile" className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-50 shadow-md object-cover" />
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-800">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.college}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.verified ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                    {user.verified ? 'Verified Student' : 'Verification Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 flex-1 md:justify-end">
               <div className="flex-1 md:flex-none md:w-40 bg-primary-50 p-4 rounded-2xl border border-primary-100">
                 <p className="text-primary-600 text-xs font-bold uppercase mb-1">Total Earnings</p>
                 <p className="text-2xl font-bold text-slate-800">${user.earnings || 0}</p>
               </div>
               <div className="flex-1 md:flex-none md:w-40 bg-secondary-50 p-4 rounded-2xl border border-emerald-100">
                 <p className="text-emerald-600 text-xs font-bold uppercase mb-1">Sustainability</p>
                 <p className="text-2xl font-bold text-slate-800">{user.savings || 0} <span className="text-sm font-normal text-slate-500">pts</span></p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 md:p-0">
          {/* Main Content (Listings) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Analytics Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Earnings Activity</h3>
                <select className="text-xs bg-slate-50 border-none rounded-lg p-2 outline-none">
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                </select>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f1f5f9' }}
                    />
                    <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                       {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#0ea5e9' : '#cbd5e1'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* My Listings Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">My Listings</h3>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['ACTIVE', 'DRAFT', 'SOLD'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div className="divide-y divide-slate-100">
                 {loadingItems ? (
                   <div className="p-8 text-center text-slate-400">Loading listings...</div>
                 ) : filteredItems.length > 0 ? (
                   filteredItems.map(item => (
                     <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                       <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                         {item.image ? (
                           <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-400">
                             <Eye size={20} />
                           </div>
                         )}
                       </div>
                       
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2">
                           <h4 className="font-semibold text-slate-800 truncate">{item.title}</h4>
                           {item.status === 'DRAFT' && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">DRAFT</span>}
                           {item.status === 'SOLD' && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">SOLD</span>}
                         </div>
                         <p className="text-sm text-slate-500 font-medium">${item.price}</p>
                         <p className="text-xs text-slate-400 mt-0.5 truncate">{item.category} • {new Date().toLocaleDateString()}</p>
                       </div>

                       <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         {activeTab === 'ACTIVE' && (
                           <button 
                             onClick={() => handleMarkSold(item)}
                             className="p-2 text-green-600 hover:bg-green-50 rounded-lg" 
                             title="Mark as Sold"
                           >
                             <CheckCircle2 size={18} />
                           </button>
                         )}
                         <button 
                           onClick={() => onEditItem && onEditItem(item)}
                           className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" 
                           title="Edit"
                         >
                           <Edit2 size={18} />
                         </button>
                         <button 
                           onClick={() => handleDelete(item.id)}
                           className="p-2 text-red-500 hover:bg-red-50 rounded-lg" 
                           title="Delete"
                         >
                           <Trash2 size={18} />
                         </button>
                       </div>
                     </div>
                   ))
                 ) : (
                   <div className="p-8 text-center">
                     <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                       <Edit2 size={24} />
                     </div>
                     <p className="text-slate-500 text-sm">No {activeTab.toLowerCase()} listings found.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Right Sidebar Menu */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 h-fit">
            {[
              { icon: User, label: "Edit Profile" },
              { icon: Award, label: "My Badges", value: "3 New" },
              { icon: Settings, label: "Preferences" },
              { icon: LogOut, label: "Log Out", color: "text-red-500", onClick: signOut },
            ].map((item, i) => (
              <button key={i} onClick={item.onClick} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${item.color ? 'bg-red-50' : 'bg-slate-50'} group-hover:scale-105 transition-transform`}>
                    <item.icon size={18} className={item.color || "text-slate-500"} />
                  </div>
                  <span className={`text-sm font-medium ${item.color || "text-slate-700"}`}>{item.label}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  {item.value && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{item.value}</span>}
                  <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};