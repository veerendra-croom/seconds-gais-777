import React, { useEffect, useState } from 'react';
import { UserProfile, Report, College } from '../types';
import { api } from '../services/api';
import { ShieldCheck, Users, ShoppingBag, DollarSign, CheckCircle2, XCircle, Loader2, Key, Settings, LogOut, Flag, AlertTriangle, Trash2, TrendingUp, Activity, Ban, Search, Eye, ChevronLeft, ChevronRight, Clock, School, Plus, Save, Globe, Edit2, Layers, ToggleLeft, ToggleRight, Menu, X } from 'lucide-react';
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
    <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 animate-slide-up">
      <div className="w-full md:w-1/3 aspect-video bg-slate-100 rounded-xl overflow-hidden relative group border border-slate-200">
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
              <p className="text-slate-500 mb-2 text-sm">{user.college} • {user.college_email}</p>
              <span className="px-2 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-100">
                 Status: {user.verificationStatus || 'PENDING'}
              </span>
           </div>
           <div className="text-right text-xs text-slate-400 hidden sm:block">
              <p>ID: {user.id.substring(0,8)}...</p>
              <p>{new Date(user.created_at).toLocaleDateString()}</p>
           </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => onVerify(user.id, true)}
            className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 transition-colors shadow-sm hover:shadow-md active:scale-95"
          >
            <CheckCircle2 size={18} /> Approve
          </button>
          <button 
            onClick={() => onVerify(user.id, false)}
            className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex items-center justify-center gap-2 transition-all active:scale-95"
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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'COLLEGES' | 'VERIFICATIONS' | 'REPORTS' | 'SETTINGS'>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Settings State
  const [appSettings, setAppSettings] = useState({
    admin_signup_code: '',
    global_banner_text: '',
    global_banner_active: 'false',
    transaction_fee_percent: '5',
    maintenance_mode: 'false'
  });
  
  // Modules State
  const [moduleFlags, setModuleFlags] = useState<Record<string, boolean>>({
    'BUY': true, 'SELL': true, 'RENT': true, 'SHARE': true, 'SWAP': true, 'EARN': true, 'REQUEST': true
  });

  // College Add/Edit State
  const [newCollege, setNewCollege] = useState({ id: '', name: '', domain: '', latitude: '', longitude: '' });
  const [isEditingCollege, setIsEditingCollege] = useState(false);

  const { showToast } = useToast();
  
  // User Management State
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const USERS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
    const subscription = api.subscribeToAdminEvents(() => {
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
      } else if (activeTab === 'COLLEGES') {
        const data = await api.getColleges();
        setColleges(data);
      } else if (activeTab === 'SETTINGS') {
        const configs = await api.getAllAppConfigs();
        setAppSettings(prev => ({ ...prev, ...configs }));
        if (configs['active_modules']) {
           try { setModuleFlags(JSON.parse(configs['active_modules'])); } catch {}
        }
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
      showToast(`Action failed: ${e.message}`, 'error');
    }
  };

  const handleBanUser = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(currentStatus ? "Unban this user?" : "Ban this user? They will effectively be locked out.")) return;
    try {
      await api.adminBanUser(userId, !currentStatus);
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: !currentStatus } : u));
      showToast(currentStatus ? "User Unbanned" : "User Banned", 'success');
    } catch (e) {
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
      showToast("Failed to resolve report", 'error');
    }
  };

  const handleSaveSetting = async (key: string, value: string) => {
    try {
      await api.updateAppConfig(key, value);
      showToast("Setting Saved", 'success');
    } catch (e) {
      showToast("Failed to save setting", 'error');
    }
  };

  const handleSaveModules = async (newFlags: Record<string, boolean>) => {
     setModuleFlags(newFlags);
     try {
        await api.updateAppConfig('active_modules', JSON.stringify(newFlags));
     } catch (e) { showToast("Failed to save modules", 'error'); }
  };

  const handleSaveCollege = async () => {
    if (!newCollege.name || !newCollege.domain) return;
    try {
      const collegeData = {
        name: newCollege.name,
        domain: newCollege.domain,
        latitude: parseFloat(newCollege.latitude) || 0,
        longitude: parseFloat(newCollege.longitude) || 0
      };

      if (newCollege.id) {
         await api.updateCollege(newCollege.id, collegeData);
         showToast("College Updated", 'success');
      } else {
         await api.addCollege(collegeData);
         showToast("College Added!", 'success');
      }
      
      setNewCollege({ id: '', name: '', domain: '', latitude: '', longitude: '' });
      setIsEditingCollege(false);
      loadData();
    } catch (e) {
      showToast("Failed to save college", 'error');
    }
  };

  const handleEditCollege = (college: College) => {
     setNewCollege({
       id: college.id,
       name: college.name,
       domain: college.domain,
       latitude: college.latitude.toString(),
       longitude: college.longitude.toString()
     });
     setIsEditingCollege(true);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCollege = async (id: string) => {
    if (!confirm("Delete this college? This may affect users.")) return;
    try {
      await api.deleteCollege(id);
      setColleges(prev => prev.filter(c => c.id !== id));
      showToast("College deleted", 'success');
    } catch (e) {
      showToast("Failed to delete", 'error');
    }
  };

  const handleUserSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearch(e.target.value);
    setUsersPage(0);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col shadow-2xl glass-dark
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-slate-900 font-black text-lg">S</div>
            Admin
          </h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: 'OVERVIEW', label: 'Analytics', icon: Activity, color: 'bg-blue-500', text: 'text-blue-400' },
            { id: 'USERS', label: 'All Users', icon: Users, color: 'bg-purple-500', text: 'text-purple-400' },
            { id: 'COLLEGES', label: 'Colleges', icon: School, color: 'bg-emerald-500', text: 'text-emerald-400' },
            { id: 'VERIFICATIONS', label: 'Verifications', icon: ShieldCheck, color: 'bg-orange-500', text: 'text-orange-400', count: pendingUsers.length },
            { id: 'REPORTS', label: 'Reports', icon: Flag, color: 'bg-red-500', text: 'text-red-400', count: reports.length },
            { id: 'SETTINGS', label: 'System', icon: Settings, color: 'bg-slate-600', text: 'text-slate-400' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-slate-800 text-white shadow-lg shadow-black/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
            >
              <div className={`p-1.5 rounded-lg ${activeTab === item.id ? item.color + ' text-white' : 'bg-slate-800 ' + item.text}`}>
                <item.icon size={18} />
              </div>
              {item.label}
              {item.count ? <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.count}</span> : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen w-full">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
                {activeTab === 'OVERVIEW' && 'Platform Analytics'}
                {activeTab === 'USERS' && 'User Management'}
                {activeTab === 'COLLEGES' && 'Campus Network'}
                {activeTab === 'VERIFICATIONS' && 'Pending Approvals'}
                {activeTab === 'REPORTS' && 'Content Moderation'}
                {activeTab === 'SETTINGS' && 'System Settings'}
              </h2>
              <p className="text-slate-500 text-sm mt-1 hidden md:block">Manage the platform and ensure community safety.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 self-end md:self-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
                 <div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-1">Total Users</p>
                   <p className="text-3xl md:text-4xl font-bold text-slate-800">{loading ? '...' : stats.users}</p>
                 </div>
                 <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users size={28} />
                 </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
                 <div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-1">Active Listings</p>
                   <p className="text-3xl md:text-4xl font-bold text-slate-800">{loading ? '...' : stats.items}</p>
                 </div>
                 <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShoppingBag size={28} />
                 </div>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all sm:col-span-2 lg:col-span-1">
                 <div>
                   <p className="text-slate-500 text-xs font-bold uppercase mb-1">Platform GMV</p>
                   <p className="text-3xl md:text-4xl font-bold text-slate-800">${loading ? '...' : stats.gmv.toLocaleString()}</p>
                 </div>
                 <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DollarSign size={28} />
                 </div>
               </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Revenue & User Growth Chart */}
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[350px] md:h-[400px] flex flex-col w-full min-w-0">
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
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[350px] md:h-[400px] flex flex-col w-full min-w-0">
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
                 <table className="w-full text-sm text-left whitespace-nowrap">
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

        {/* --- USERS TAB --- */}
        {activeTab === 'USERS' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
             <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 bg-slate-50/50">
                <div className="relative flex-1 w-full">
                   <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search users by name or email..." 
                     value={userSearch}
                     onChange={handleUserSearch}
                     className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-sm"
                   />
                </div>
                <div className="text-xs text-slate-500 font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm w-full md:w-auto text-center">
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
                 <table className="w-full text-sm text-left whitespace-nowrap">
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

        {/* --- COLLEGES TAB --- */}
        {activeTab === 'COLLEGES' && (
          <div className="space-y-6 animate-slide-up">
             <div className="flex justify-between items-center">
                <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm font-bold text-slate-600">
                   {colleges.length} Active Campuses
                </div>
                <button 
                  onClick={() => { setIsEditingCollege(!isEditingCollege); setNewCollege({ id: '', name: '', domain: '', latitude: '', longitude: '' }); }}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-slate-800 transition-all active:scale-95"
                >
                   <Plus size={18} /> <span className="hidden md:inline">Add College</span>
                </button>
             </div>

             {isEditingCollege && (
                <div className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100 animate-in fade-in slide-in-from-top-4">
                   <h3 className="font-bold text-slate-800 mb-4">{newCollege.id ? 'Edit Campus' : 'Add New Campus'}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input 
                        type="text" 
                        placeholder="University Name" 
                        className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                        value={newCollege.name}
                        onChange={e => setNewCollege({...newCollege, name: e.target.value})}
                      />
                      <input 
                        type="text" 
                        placeholder="Email Domain (e.g., stanford.edu)" 
                        className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                        value={newCollege.domain}
                        onChange={e => setNewCollege({...newCollege, domain: e.target.value})}
                      />
                      <input 
                        type="number" 
                        placeholder="Latitude" 
                        className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                        value={newCollege.latitude}
                        onChange={e => setNewCollege({...newCollege, latitude: e.target.value})}
                      />
                      <input 
                        type="number" 
                        placeholder="Longitude" 
                        className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                        value={newCollege.longitude}
                        onChange={e => setNewCollege({...newCollege, longitude: e.target.value})}
                      />
                   </div>
                   <div className="flex justify-end gap-3">
                      <button onClick={() => setIsEditingCollege(false)} className="px-4 py-2 text-slate-500 font-bold">Cancel</button>
                      <button onClick={handleSaveCollege} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">{newCollege.id ? 'Update' : 'Save'}</button>
                   </div>
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colleges.map(college => (
                   <div key={college.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                      <div className="flex justify-between items-start mb-2">
                         <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                            <School size={20} />
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={() => handleEditCollege(college)}
                             className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                           >
                              <Edit2 size={16} />
                           </button>
                           <button 
                             onClick={() => handleDeleteCollege(college.id)}
                             className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                           >
                              <Trash2 size={16} />
                           </button>
                         </div>
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg mb-1">{college.name}</h4>
                      <p className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded inline-block">@{college.domain}</p>
                      
                      <div className="mt-4 pt-4 border-t border-slate-50 flex gap-4 text-xs text-slate-400">
                         <span className="flex items-center gap-1"><Globe size={12}/> {college.latitude.toFixed(4)}</span>
                         <span>{college.longitude.toFixed(4)}</span>
                      </div>
                   </div>
                ))}
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
               <div key={r.id} className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-red-100 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
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
                      <span className="text-xs text-slate-400 font-medium">{new Date(r.createdAt).toLocaleDateString()}</span
                   </div>
                   
                   <div className="flex gap-3 mt-4">
                     <button 
                       onClick={() => handleResolveReport(r.id, 'DELETE_ITEM', r.itemId)}
                       className="flex-1 md:flex-none px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 flex items-center justify-center gap-2 shadow-sm"
                     >
                       <Trash2 size={16} /> Delete Item & Resolve
                     </button>
                     <button 
                       onClick={() => handleResolveReport(r.id, 'DISMISS')}
                       className="flex-1 md:flex-none px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-sm font-bold hover:bg-white hover:border-slate-300 transition-colors"
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
           <div className="max-w-2xl space-y-6 animate-slide-up">
              
              {/* Feature Flags Card */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                    <Layers size={24} className="text-slate-400" /> Module Configuration
                 </h3>
                 <p className="text-sm text-slate-500 mb-6">Enable or disable specific features for all users.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(moduleFlags).map((mod) => (
                       <div key={mod} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700 text-sm">{mod}</span>
                          <button 
                            onClick={() => handleSaveModules({...moduleFlags, [mod]: !moduleFlags[mod]})}
                            className={`p-1 rounded-full transition-colors ${moduleFlags[mod] ? 'text-green-500' : 'text-slate-300'}`}
                          >
                             {moduleFlags[mod] ? <ToggleRight size={32} fill="currentColor" /> : <ToggleLeft size={32} />}
                          </button>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Security Card */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                    <Key size={24} className="text-slate-400" /> Admin Access
                 </h3>
                 <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Admin Signup Code</label>
                    <div className="flex gap-3">
                       <div className="relative flex-1">
                          <input 
                            type="text" 
                            value={appSettings.admin_signup_code}
                            onChange={(e) => setAppSettings(prev => ({ ...prev, admin_signup_code: e.target.value }))}
                            placeholder="Enter secret code"
                            className="w-full pl-4 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 font-mono text-sm"
                          />
                       </div>
                       <button 
                         onClick={() => handleSaveSetting('admin_signup_code', appSettings.admin_signup_code)}
                         className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                       >
                         Update
                       </button>
                    </div>
                 </div>
              </div>

              {/* Global Config Card */}
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                    <Settings size={24} className="text-slate-400" /> App Configuration
                 </h3>
                 
                 <div className="space-y-6">
                    <div>
                       <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Announcement Banner</label>
                       <div className="flex gap-3 mb-2">
                          <input 
                            type="text" 
                            value={appSettings.global_banner_text}
                            onChange={(e) => setAppSettings(prev => ({ ...prev, global_banner_text: e.target.value }))}
                            placeholder="e.g. System maintenance scheduled for tonight"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button 
                            onClick={() => handleSaveSetting('global_banner_text', appSettings.global_banner_text)}
                            className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-50"
                          >
                            <Save size={18} />
                          </button>
                       </div>
                       <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={appSettings.global_banner_active === 'true'}
                            onChange={(e) => {
                               const val = e.target.checked ? 'true' : 'false';
                               setAppSettings(prev => ({...prev, global_banner_active: val}));
                               handleSaveSetting('global_banner_active', val);
                            }}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          Show Banner on Home Screen
                       </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Transaction Fee (%)</label>
                          <div className="relative">
                             <input 
                               type="number" 
                               value={appSettings.transaction_fee_percent}
                               onChange={(e) => setAppSettings(prev => ({ ...prev, transaction_fee_percent: e.target.value }))}
                               onBlur={() => handleSaveSetting('transaction_fee_percent', appSettings.transaction_fee_percent)}
                               className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold"
                             />
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                          </div>
                       </div>
                       
                       <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-2 p-3 border border-red-100 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition-colors">
                             <input 
                               type="checkbox" 
                               checked={appSettings.maintenance_mode === 'true'}
                               onChange={(e) => {
                                  const val = e.target.checked ? 'true' : 'false';
                                  setAppSettings(prev => ({...prev, maintenance_mode: val}));
                                  handleSaveSetting('maintenance_mode', val);
                               }}
                               className="w-5 h-5 rounded text-red-600 focus:ring-red-500"
                             />
                             <div>
                                <span className="block text-red-700 font-bold text-sm">Maintenance Mode</span>
                                <span className="block text-red-500 text-[10px] font-bold uppercase tracking-wider">Locks All Actions</span>
                             </div>
                          </label>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};