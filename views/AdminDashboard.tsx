
import React, { useEffect, useState } from 'react';
import { UserProfile, Report } from '../types';
import { api } from '../services/api';
import { ShieldCheck, Users, ShoppingBag, DollarSign, CheckCircle2, XCircle, Loader2, Key, Settings, LogOut, Flag, AlertTriangle, Trash2, TrendingUp, Activity, Ban, Search, Eye, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { signOut } from '../services/supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { useToast } from '../components/Toast';

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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-6 animate-slide-up">
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
        <div className="flex justify-between items-start">
           <div>
              <h3 className="text-xl font-bold text-slate-800">{user.full_name}</h3>
              <p className="text-slate-500 mb-2">{user.college} • {user.college_email}</p>
              <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-100">
                 Status: {user.verificationStatus || 'PENDING'}
              </span>
           </div>
           <div className="text-right text-xs text-slate-400">
              <p>ID: {user.id.substring(0,8)}...</p>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
           </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => onVerify(user.id, true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2 transition-colors shadow-sm hover:shadow-md"
          >
            <CheckCircle2 size={18} /> Approve
          </button>
          <button 
            onClick={() => onVerify(user.id, false)}
            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center gap-2 transition-all"
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
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'VERIFICATIONS' | 'REPORTS' | 'SETTINGS'>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState('');
  const { showToast } = useToast();
  
  // User Management State
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const USERS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
    const subscription = api.subscribeToAdminEvents(() => {
       // Debounce refresh to avoid flickering
       setTimeout(() => loadData(), 500);
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
        const txnData = await api.adminGetRecentTransactions();
        setRecentTxns(txnData);
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
      showToast("Failed to load admin data", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId: string, approve: boolean) => {
    try {
      await api.adminVerifyUser(userId, approve);
      setPendingUsers(prev => prev.filter(u => u.id !== userId));
      showToast(approve ? "User Verified Successfully" : "User Rejected", 'success');
    } catch (e: any) {
      console.error("Verification failed", e);
      showToast(`Action failed: ${e.message || JSON.stringify(e)}`, 'error');
    }
  };

  const handleBanUser = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(currentStatus ? "Unban this user?" : "Ban this user? They will effectively be locked out.")) return;
    try {
      await api.adminBanUser(userId, !currentStatus);
      // Optimistic update
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: !currentStatus } : u));
      showToast(currentStatus ? "User Unbanned" : "User Banned", 'success');
    } catch (e) {
      console.error(e);
      showToast("Failed to update ban status", 'error');
    }
  };

  const handleResolveReport = async (reportId: string, action: 'DISMISS' | 'DELETE_ITEM', itemId?: string) => {
    if (!window.confirm(action === 'DELETE_ITEM' ? "Are you sure you want to delete this item? This cannot be undone." : "Dismiss this report?")) return;
    try {
      await api.adminResolveReport(reportId, action, itemId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      showToast("Report Resolved", 'success');
    } catch (e) {
      console.error("Report resolution failed", e);
      showToast("Failed to resolve report", 'error');
    }
  };

  const handleUpdateCode = async () => {
    if (!newAdminCode) return;
    try {
      await api.updateAdminCode(newAdminCode);
      showToast("Admin Code Updated Successfully!", 'success');
      setNewAdminCode('');
    } catch (e) {
      showToast("Failed to update code.", 'error');
    }
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch(e.target.value);
    setUsersPage(0); // Reset page on search
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 shadow-2xl glass-dark">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-slate-900 font-black text-lg">S</div>
            Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('OVERVIEW')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'OVERVIEW' ? 'bg-slate-800 text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'OVERVIEW' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-blue-400'}`}><Activity size={18} /></div>
            Analytics
          </button>
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'USERS' ? 'bg-slate-800 text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'USERS' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-purple-400'}`}><Users size={18} /></div>
            All Users
          </button>
          <button 
            onClick={() => setActiveTab('VERIFICATIONS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'VERIFICATIONS' ? 'bg-slate-800 text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'VERIFICATIONS' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-orange-400'}`}><ShieldCheck size={18} /></div>
            Verifications
            {pendingUsers.length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingUsers.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('REPORTS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'REPORTS' ? 'bg-slate-800 text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'REPORTS' ? 'bg-red-500 text-white' : 'bg-slate-800 text-red-400'}`}><Flag size={18} /></div>
            Reports
            {reports.length > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{reports.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'SETTINGS' ? 'bg-slate-800 text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'SETTINGS' ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400'}`}><Settings size={18} /></div>
            Settings
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
              {activeTab === 'OVERVIEW' && 'Platform Analytics'}
              {activeTab === 'USERS' && 'User Management'}
              {activeTab === 'VERIFICATIONS' && 'Pending Approvals'}
              {activeTab === 'REPORTS' && 'Content Moderation'}
              {activeTab === 'SETTINGS' && 'System Settings'}
            </h2>
            <p className="text-slate-500 mt-1">Manage the platform and ensure community safety.</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <div className="text-right">
               <p className="text-sm font-bold text-slate-800">{user.name}</p>
               <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Super Admin</p>
            </div>
            <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
          </div>
        </header>

        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-slide-up">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
                 <div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Users</p>
                   <p className="text-4xl font-bold text-slate-800">{loading ? '...' : stats.users}</p>
                 </div>
                 <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users size={28} />
                 </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
                 <div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-1">Active Listings</p>
                   <p className="text-4xl font-bold text-slate-800">{loading ? '...' : stats.items}</p>
                 </div>
                 <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag size={28} />
                 </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
                 <div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-1">Platform GMV</p>
                   <p className="text-4xl font-bold text-slate-800">${loading ? '...' : stats.gmv.toLocaleString()}</p>
                 </div>
                 <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign size={28} />
                 </div>
               </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-2 gap-6">
               {/* Revenue & User Growth Chart */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[400px] flex flex-col w-full min-w-0">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-green-500"/> Growth (Last 7 Days)</h3>
                  <div className="flex-1 w-full min-h-0">
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
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[400px] flex flex-col w-full min-w-0">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><ShoppingBag size={20} className="text-purple-500"/> Inventory Mix</h3>
                  <div className="flex-1 w-full min-h-0">
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

            {/* Recent Transactions Feed */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Clock size={20} className="text-blue-500"/> Recent Transactions</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                     <tr>
                       <th className="px-6 py-3 rounded-l-lg">Item</th>
                       <th className="px-6 py-3">Buyer</th>
                       <th className="px-6 py-3">Seller</th>
                       <th className="px-6 py-3">Amount</th>
                       <th className="px-6 py-3">Status</th>
                       <th className="px-6 py-3 rounded-r-lg text-right">Date</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {recentTxns.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-400">No transactions yet.</td></tr>
                     ) : recentTxns.map(txn => (
                        <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-bold text-slate-800">{txn.item?.title || 'Unknown'}</td>
                           <td className="px-6 py-4">{txn.buyer?.full_name}</td>
                           <td className="px-6 py-4">{txn.seller?.full_name}</td>
                           <td className="px-6 py-4 font-bold text-green-600">${txn.amount}</td>
                           <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${txn.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                 {txn.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right text-slate-400 text-xs">
                              {new Date(txn.created_at).toLocaleDateString()}
                           </td>
                        </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* ... Rest of tabs (USERS, VERIFICATIONS, REPORTS, SETTINGS) are unchanged ... */}
        {activeTab === 'USERS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
             {/* ... User Management Logic ... */}
             <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                <div className="relative flex-1">
                   <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search users by name or email..." 
                     value={userSearch}
                     onChange={handleUserSearch}
                     className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm"
                   />
                </div>
                <div className="text-xs text-slate-500 font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                   Total Records: {usersTotal}
                </div>
             </div>
             
             {loading ? (
                <div className="p-20 text-center text-slate-400">
                   <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                   Fetching users...
                </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                     <tr>
                       <th className="px-6 py-4">User</th>
                       <th className="px-6 py-4">College</th>
                       <th className="px-6 py-4">Role</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {allUsers.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No users found matching your search.</td>
                        </tr>
                     ) : allUsers.map(u => (
                       <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                         <td className="px-6 py-4 flex items-center gap-3">
                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-10 h-10 rounded-full border border-slate-100" />
                            <div>
                               <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{u.full_name}</p>
                               <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                         </td>
                         <td className="px-6 py-4 font-medium text-slate-600">{u.college}</td>
                         <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                               {u.role}
                            </span>
                         </td>
                         <td className="px-6 py-4">
                            {u.banned ? (
                               <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600 flex items-center gap-1 w-fit"><XCircle size={12}/> BANNED</span>
                            ) : u.verified ? (
                               <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-600 flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> VERIFIED</span>
                            ) : (
                               <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-600 flex items-center gap-1 w-fit"><Loader2 size={12} className="animate-spin"/> PENDING</span>
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

             <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
                <button 
                  disabled={usersPage === 0 || loading}
                  onClick={() => setUsersPage(p => Math.max(0, p - 1))}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors"
                >
                   <ChevronLeft size={14} /> Previous
                </button>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Page {usersPage + 1}</span>
                <button 
                  disabled={(usersPage + 1) * USERS_PER_PAGE >= usersTotal || loading}
                  onClick={() => setUsersPage(p => p + 1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:bg-slate-50 transition-colors"
                >
                   Next <ChevronRight size={14} />
                </button>
             </div>
          </div>
        )}

        {activeTab === 'VERIFICATIONS' && (
          <div className="space-y-4 animate-slide-up">
            {pendingUsers.length === 0 && !loading && (
              <div className="text-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-slate-300" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-600">All Caught Up!</h3>
                 <p className="text-sm">No pending ID verifications at the moment.</p>
              </div>
            )}
            
            {pendingUsers.map(u => (
              <VerificationCard key={u.id} user={u} onVerify={handleVerify} />
            ))}
          </div>
        )}

        {activeTab === 'REPORTS' && (
           <div className="space-y-4 animate-slide-up">
             {reports.length === 0 && !loading && (
               <div className="text-center py-24 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <ShieldCheck size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-600">Community Safe</h3>
                  <p className="text-sm">No open reports to review.</p>
               </div>
             )}
             
             {reports.map(r => (
               <div key={r.id} className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 flex gap-6 hover:shadow-md transition-shadow">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                    <AlertTriangle size={32} />
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h3 className="font-bold text-slate-800 text-lg">{r.reason}</h3>
                           <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full uppercase">Pending</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">
                           Reported Item: <span className="font-bold text-slate-900">{r.item?.title || 'Unknown/Deleted Item'}</span>
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{new Date(r.createdAt).toLocaleDateString()}</span>
                   </div>
                   
                   <div className="flex gap-3 mt-4">
                     <button 
                       onClick={() => handleResolveReport(r.id, 'DELETE_ITEM', r.itemId)}
                       className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center gap-2 shadow-sm"
                     >
                       <Trash2 size={16} /> Delete Item & Resolve
                     </button>
                     <button 
                       onClick={() => handleResolveReport(r.id, 'DISMISS')}
                       className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm font-bold hover:bg-white hover:border-slate-300 transition-colors"
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
           <div className="max-w-xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-slide-up">
              <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                 <Settings size={24} className="text-slate-400" /> Security Settings
              </h3>
              <div className="space-y-6">
                <div>
                   <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Admin Signup Code</label>
                   <div className="flex gap-3">
                      <div className="relative flex-1">
                         <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                         <input 
                           type="text" 
                           value={newAdminCode}
                           onChange={(e) => setNewAdminCode(e.target.value)}
                           placeholder="Enter new secret code"
                           className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 font-mono text-sm"
                         />
                      </div>
                      <button 
                        onClick={handleUpdateCode}
                        disabled={!newAdminCode}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors"
                      >
                        Update
                      </button>
                   </div>
                   <p className="text-xs text-slate-400 mt-2">
                      <span className="text-red-500 font-bold">Warning:</span> Changing this code will prevent new admins from registering until they know the new code.
                   </p>
                </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};
