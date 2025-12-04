
import React, { useEffect, useState } from 'react';
import { UserProfile, Report } from '../types';
import { api } from '../services/api';
import { ShieldCheck, Users, ShoppingBag, DollarSign, CheckCircle2, XCircle, Loader2, Key, Settings, LogOut, Flag, AlertTriangle, Trash2, TrendingUp, Activity, Ban, Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { signOut } from '../services/supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

interface AdminDashboardProps {
  user: UserProfile;
}

// Sub-component to handle async image loading for verifications
const VerificationCard: React.FC<{ user: any, onVerify: (id: string, approved: boolean) => void }> = ({ user, onVerify }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImage = async () => {
      const url = await api.adminGetVerificationImage(user.id);
      setImageUrl(url);
      setLoading(false);
    };
    fetchImage();
  }, [user.id]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-6">
      <div className="w-1/3 aspect-video bg-slate-100 rounded-xl overflow-hidden relative group border border-slate-200">
         {loading ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <Loader2 className="animate-spin text-slate-400" />
           </div>
         ) : imageUrl ? (
           <img src={imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" onClick={() => window.open(imageUrl, '_blank')} style={{ cursor: 'zoom-in' }} />
         ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
              <AlertTriangle size={24} className="mb-2" />
              <span className="text-xs">Image Not Found</span>
           </div>
         )}
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-800">{user.full_name}</h3>
        <p className="text-slate-500 mb-4">{user.college} • {user.college_email}</p>
        
        <div className="flex gap-3">
          <button 
            onClick={() => onVerify(user.id, true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"
          >
            <CheckCircle2 size={18} /> Approve
          </button>
          <button 
            onClick={() => onVerify(user.id, false)}
            className="px-6 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 flex items-center gap-2"
          >
            <XCircle size={18} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<any>({ users: 0, items: 0, gmv: 0 });
  const [analytics, setAnalytics] = useState<any>({ chartData: [], categoryData: [] });
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'VERIFICATIONS' | 'REPORTS' | 'SETTINGS'>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState('');
  
  // User Management State
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const USERS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
    const subscription = api.subscribeToAdminEvents(() => {
       console.log("Realtime update received");
       loadData(); // Re-fetch on any DB change
    });
    return () => { subscription.unsubscribe(); }
  }, [activeTab, usersPage, userSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'OVERVIEW') {
        const statsData = await api.adminGetStats();
        setStats(statsData);
        const chartsData = await api.adminGetAnalytics();
        setAnalytics(chartsData);
      } else if (activeTab === 'VERIFICATIONS') {
        const users = await api.adminGetPendingVerifications();
        setPendingUsers(users);
      } else if (activeTab === 'REPORTS') {
        const data = await api.adminGetReports();
        setReports(data);
      } else if (activeTab === 'USERS') {
        const { users, count } = await api.adminGetAllUsers(usersPage, USERS_PER_PAGE, userSearch);
        setAllUsers(users);
        setUsersTotal(count);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, approve: boolean) => {
    try {
      await api.adminVerifyUser(userId, approve);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e) {
      console.error("Verification failed", e);
    }
  };

  const handleBanUser = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(currentStatus ? "Unban this user?" : "Ban this user? They will effectively be locked out.")) return;
    try {
      await api.adminBanUser(userId, !currentStatus);
      // Optimistic update
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: !currentStatus } : u));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'DISMISS' | 'DELETE_ITEM', itemId?: string) => {
    if (!window.confirm(action === 'DELETE_ITEM' ? "Are you sure you want to delete this item? This cannot be undone." : "Dismiss this report?")) return;
    try {
      await api.adminResolveReport(reportId, action, itemId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (e) {
      console.error("Report resolution failed", e);
    }
  };

  const handleUpdateCode = async () => {
    if (!newAdminCode) return;
    try {
      await api.updateAdminCode(newAdminCode);
      alert("Admin Code Updated Successfully!");
      setNewAdminCode('');
    } catch (e) {
      alert("Failed to update code.");
    }
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch(e.target.value);
    setUsersPage(0); // Reset page on search
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-green-400" /> Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'OVERVIEW' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="p-1 bg-blue-500/20 rounded text-blue-400"><Activity size={18} /></div>
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'USERS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="p-1 bg-purple-500/20 rounded text-purple-400"><Users size={18} /></div>
            All Users
          </button>
          <button 
            onClick={() => setActiveTab('VERIFICATIONS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'VERIFICATIONS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="p-1 bg-orange-500/20 rounded text-orange-400"><ShieldCheck size={18} /></div>
            Verifications
            {pendingUsers.length > 0 && <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('REPORTS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'REPORTS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="p-1 bg-red-500/20 rounded text-red-400"><Flag size={18} /></div>
            Reports
            {reports.length > 0 && <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">{reports.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'SETTINGS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="p-1 bg-slate-700 rounded text-slate-300"><Settings size={18} /></div>
            Settings
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'OVERVIEW' && 'Platform Analytics'}
            {activeTab === 'USERS' && 'User Management'}
            {activeTab === 'VERIFICATIONS' && 'Pending ID Approvals'}
            {activeTab === 'REPORTS' && 'Content Moderation'}
            {activeTab === 'SETTINGS' && 'System Settings'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Admin: {user.name}</span>
            <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-300" />
          </div>
        </header>

        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                 <div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Users</p>
                   <p className="text-4xl font-bold text-slate-800">{loading ? '...' : stats.users}</p>
                 </div>
                 <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                    <Users size={24} />
                 </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                 <div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-1">Active Listings</p>
                   <p className="text-4xl font-bold text-slate-800">{loading ? '...' : stats.items}</p>
                 </div>
                 <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                    <ShoppingBag size={24} />
                 </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                 <div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-1">Platform GMV</p>
                   <p className="text-4xl font-bold text-slate-800">${loading ? '...' : stats.gmv.toLocaleString()}</p>
                 </div>
                 <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                    <DollarSign size={24} />
                 </div>
               </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-2 gap-6">
               {/* Revenue & User Growth Chart */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-6">Growth (Last 7 Days)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.chartData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                        <YAxis yAxisId="right" orientation="right" fontSize={10} axisLine={false} tickLine={false} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <Tooltip />
                        <Area yAxisId="left" type="monotone" dataKey="sales" stroke="#10b981" fillOpacity={1} fill="url(#colorSales)" name="Sales ($)" />
                        <Area yAxisId="right" type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" name="New Users" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
               </div>

               {/* Category Distribution */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-6">Inventory by Category</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.categoryData}>
                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                          {analytics.categoryData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index % 5]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                <div className="relative flex-1">
                   <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search users by name or email..." 
                     value={userSearch}
                     onChange={handleUserSearch}
                     className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                   />
                </div>
                <div className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">
                   Total: {usersTotal}
                </div>
             </div>
             
             {loading ? (
                <div className="p-12 text-center text-slate-400">
                   <Loader2 className="animate-spin mx-auto mb-2" />
                   Fetching users...
                </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                     <tr>
                       <th className="px-6 py-3">User</th>
                       <th className="px-6 py-3">College</th>
                       <th className="px-6 py-3">Role</th>
                       <th className="px-6 py-3">Status</th>
                       <th className="px-6 py-3 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {allUsers.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                        </tr>
                     ) : allUsers.map(u => (
                       <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                         <td className="px-6 py-4 flex items-center gap-3">
                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-8 h-8 rounded-full" />
                            <div>
                               <p className="font-bold text-slate-900">{u.full_name}</p>
                               <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                         </td>
                         <td className="px-6 py-4">{u.college}</td>
                         <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                               {u.role}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            {u.banned ? (
                               <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600">BANNED</span>
                            ) : u.verified ? (
                               <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-600">VERIFIED</span>
                            ) : (
                               <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-600">PENDING</span>
                            )}
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleBanUser(u.id, u.banned)}
                              className={`p-2 rounded-lg transition-colors ${u.banned ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                              title={u.banned ? "Unban User" : "Ban User"}
                            >
                               {u.banned ? <CheckCircle2 size={16} /> : <Ban size={16} />}
                            </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}

             {/* Pagination Footer */}
             <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                <button 
                  disabled={usersPage === 0 || loading}
                  onClick={() => setUsersPage(p => Math.max(0, p - 1))}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
                >
                   <ChevronLeft size={14} /> Previous
                </button>
                <span className="text-xs text-slate-400 font-medium">Page {usersPage + 1}</span>
                <button 
                  disabled={(usersPage + 1) * USERS_PER_PAGE >= usersTotal || loading}
                  onClick={() => setUsersPage(p => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50 transition-colors"
                >
                   Next <ChevronRight size={14} />
                </button>
             </div>
          </div>
        )}

        {activeTab === 'VERIFICATIONS' && (
          <div className="space-y-4">
            {pendingUsers.length === 0 && !loading && (
              <div className="text-center py-20 text-slate-400">All caught up! No pending verifications.</div>
            )}
            
            {pendingUsers.map(u => (
              <VerificationCard key={u.id} user={u} onVerify={handleVerify} />
            ))}
          </div>
        )}

        {activeTab === 'REPORTS' && (
           <div className="space-y-4">
             {reports.length === 0 && !loading && (
               <div className="text-center py-20 text-slate-400">
                  <CheckCircle2 size={48} className="mx-auto mb-4 text-green-300" />
                  No reports active. The platform is safe!
               </div>
             )}
             
             {reports.map(r => (
               <div key={r.id} className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex gap-6">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={32} />
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-800">{r.reason}</h3>
                        <p className="text-sm text-slate-500 mb-2">Item: <span className="font-semibold text-slate-700">{r.item?.title || 'Unknown Item'}</span></p>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                   </div>
                   
                   <div className="flex gap-3 mt-4">
                     <button 
                       onClick={() => handleResolveReport(r.id, 'DELETE_ITEM', r.itemId)}
                       className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center gap-2"
                     >
                       <Trash2 size={16} /> Delete Item & Resolve
                     </button>
                     <button 
                       onClick={() => handleResolveReport(r.id, 'DISMISS')}
                       className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200"
                     >
                       Dismiss
                     </button>
                   </div>
                 </div>
               </div>
             ))}
           </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-lg mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase">Admin Signup Code</label>
                   <div className="flex gap-2 mt-1">
                      <input 
                        type="text" 
                        value={newAdminCode}
                        onChange={(e) => setNewAdminCode(e.target.value)}
                        placeholder="Current: rani"
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg"
                      />
                      <button 
                        onClick={handleUpdateCode}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold"
                      >
                        Update
                      </button>
                   </div>
                   <p className="text-xs text-slate-400 mt-2">This code is required for new admins to register.</p>
                </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};
