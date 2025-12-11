
import React, { useEffect, useState, useRef } from 'react';
import { UserProfile, Report, College, Item } from '../types';
import { api } from '../services/api';
import { ShieldCheck, Users, ShoppingBag, DollarSign, CheckCircle2, XCircle, Loader2, Key, Settings, LogOut, Flag, AlertTriangle, Trash2, TrendingUp, Activity, Ban, Search, Eye, ChevronLeft, ChevronRight, Clock, School, Plus, Save, Globe, Edit2, Layers, ToggleLeft, ToggleRight, Menu, X, ClipboardList, Wallet, LifeBuoy, Server, User, Megaphone, Receipt, ExternalLink, Command, Download, CheckSquare, Square, FileDown, Wrench } from 'lucide-react';
import { signOut } from '../services/supabaseClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useToast } from '../components/Toast';

interface AdminDashboardProps {
  user: UserProfile;
  onSwitchToApp: () => void;
}

const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (_, value) => value === null ? '' : value)).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

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
      <div className="w-full md:w-1/3 aspect-video bg-slate-100 rounded-xl overflow-hidden relative group border border-slate-200 cursor-zoom-in" onClick={() => imageUrl && window.open(imageUrl, '_blank')}>
         {loading ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <Loader2 className="animate-spin text-slate-400" />
           </div>
         ) : imageUrl ? (
           <img src={imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
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
              <p>{new Date(user.created_at as string).toLocaleDateString()}</p>
           </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => onVerify(user.id, true)}
            className="flex-1 md:flex-none px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
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

const UserDetailModal: React.FC<{ userId: string, onClose: () => void }> = ({ userId, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetUserDetail(userId).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] overflow-hidden shadow-2xl flex flex-col relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full z-10"><X size={20}/></button>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" size={32}/></div>
        ) : (
          <div className="flex flex-col md:flex-row h-full">
             {/* Profile Sidebar */}
             <div className="w-full md:w-1/3 bg-slate-50 border-r border-slate-200 p-6 overflow-y-auto">
                <div className="text-center mb-6">
                   <img src={data.profile.avatar_url} className="w-24 h-24 rounded-full mx-auto mb-3 bg-slate-200" />
                   <h2 className="text-xl font-bold text-slate-900">{data.profile.full_name}</h2>
                   <p className="text-sm text-slate-500">{data.profile.email}</p>
                   <div className="mt-2 flex justify-center gap-2">
                      {data.profile.verified && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Verified</span>}
                      {data.profile.banned && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold">Banned</span>}
                   </div>
                </div>
                
                <div className="space-y-4 text-sm">
                   <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Joined</span> <span className="font-medium">{new Date(data.profile.created_at as string).toLocaleDateString()}</p></div>
                   <div className="flex justify-between border-b pb-2"><span className="text-slate-500">College</span> <span className="font-medium">{data.profile.college}</span></div>
                   <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Balance</span> <span className="font-medium">${data.profile.earnings}</span></div>
                   <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Impact</span> <span className="font-medium">{data.profile.savings} pts</span></div>
                   <div className="bg-indigo-50 p-3 rounded-lg mt-4 border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-800 uppercase mb-1">Risk Score</p>
                      <p className="text-2xl font-black text-indigo-600">
                        {data.reports.length > 0 ? 'High' : data.profile.verified ? 'Low' : 'Medium'}
                      </p>
                   </div>
                </div>
             </div>

             {/* Activity Feed */}
             <div className="flex-1 p-6 overflow-y-auto bg-white">
                <h3 className="font-bold text-lg mb-4">Activity Log</h3>
                
                <div className="space-y-6">
                   <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Items Listed ({data.items.length})</h4>
                      <div className="grid grid-cols-2 gap-2">
                         {data.items.map((item: any) => (
                            <div key={item.id} className="p-2 border rounded-lg flex gap-2 items-center">
                               <div className="w-8 h-8 bg-slate-100 rounded shrink-0 overflow-hidden"><img src={JSON.parse(item.image)[0]} className="w-full h-full object-cover"/></div>
                               <div className="min-w-0">
                                  <p className="text-xs font-bold truncate">{item.title}</p>
                                  <p className="text-[10px] text-slate-500">${item.price} • {item.status}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>

                   <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Transactions ({data.transactions.length})</h4>
                      <div className="space-y-2">
                         {data.transactions.map((tx: any) => (
                            <div key={tx.id} className="flex justify-between text-xs p-2 bg-slate-50 rounded-lg">
                               <span>{tx.item?.title || 'Unknown Item'}</span>
                               <span className="font-bold">${tx.amount} ({tx.status})</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CommandPalette: React.FC<{ isOpen: boolean, onClose: () => void, onAction: (action: string) => void }> = ({ isOpen, onClose, onAction }) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const actions = [
    { id: 'goto_users', label: 'Go to Users', icon: Users },
    { id: 'goto_finance', label: 'Go to Financials', icon: DollarSign },
    { id: 'goto_settings', label: 'Go to Settings', icon: Settings },
    { id: 'broadcast', label: 'Send Broadcast', icon: Megaphone },
    { id: 'export_data', label: 'Export All Data', icon: FileDown },
  ].filter(a => a.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
           <Search className="text-slate-400" size={20} />
           <input 
             ref={inputRef}
             type="text" 
             placeholder="Type a command or search..." 
             className="flex-1 outline-none text-lg text-slate-800 placeholder:text-slate-300"
             value={search}
             onChange={e => setSearch(e.target.value)}
           />
           <span className="text-xs font-bold text-slate-300 bg-slate-50 px-2 py-1 rounded">ESC</span>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
           {actions.length > 0 ? actions.map((action, i) => (
             <button 
               key={action.id}
               onClick={() => { onAction(action.id); onClose(); }}
               className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group ${i === 0 ? 'bg-slate-50' : ''}`}
             >
                <action.icon size={18} className="text-slate-400 group-hover:text-primary-500" />
                <span className="font-medium text-slate-700 group-hover:text-slate-900">{action.label}</span>
             </button>
           )) : (
             <div className="p-4 text-center text-slate-400 text-sm">No commands found.</div>
           )}
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onSwitchToApp }) => {
  const [stats, setStats] = useState<any>({ users: 0, items: 0, gmv: 0 });
  const [analytics, setAnalytics] = useState<any>({ chartData: [], categoryData: [] });
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'TRANSACTIONS' | 'COLLEGES' | 'VERIFICATIONS' | 'REPORTS' | 'SUPPORT' | 'SETTINGS'>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [inspectUserId, setInspectUserId] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  // Settings State
  const [appSettings, setAppSettings] = useState({
    admin_signup_code: '',
    global_banner_text: '',
    global_banner_active: 'false',
    transaction_fee_percent: '5',
    maintenance_mode: 'false',
    banned_keywords: ''
  });
  
  const [broadcastMessage, setBroadcastMessage] = useState({ title: '', body: '' });
  const [moduleFlags, setModuleFlags] = useState<Record<string, boolean>>({
    'BUY': true, 'SELL': true, 'RENT': true, 'SHARE': true, 'SWAP': true, 'EARN': true, 'REQUEST': true
  });
  const [newCollege, setNewCollege] = useState({ id: '', name: '', domain: '', latitude: '', longitude: '' });
  const [isEditingCollege, setIsEditingCollege] = useState(false);

  const { showToast } = useToast();
  const [usersPage, setUsersPage] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [txPage, setTxPage] = useState(0);
  const [txTotal, setTxTotal] = useState(0);
  const [txFilter, setTxFilter] = useState('');
  const USERS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
    const subscription = api.subscribeToAdminEvents(() => {
       setTimeout(() => loadData(), 500);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => { 
      subscription.unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [activeTab, usersPage, userSearch, txPage, txFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'OVERVIEW') {
        const statsData = await api.adminGetStats();
        setStats(statsData);
        const chartsData = await api.adminGetAnalytics();
        setAnalytics(chartsData);
        const logData = await api.adminGetAuditLogs();
        setLogs(logData);
      } else if (activeTab === 'VERIFICATIONS') {
        const users = await api.adminGetPendingVerifications();
        setPendingUsers(users);
      } else if (activeTab === 'REPORTS') {
        const data = await api.adminGetReports();
        setReports(data);
      } else if (activeTab === 'SUPPORT') {
        const data = await api.adminGetSupportTickets();
        setTickets(data);
      } else if (activeTab === 'USERS') {
        const { users, count } = await api.adminGetAllUsers(usersPage, USERS_PER_PAGE, userSearch);
        setAllUsers(users);
        setUsersTotal(count);
      } else if (activeTab === 'TRANSACTIONS') {
        const { transactions, count } = await api.adminGetAllTransactions(txPage, USERS_PER_PAGE, txFilter);
        setAllTransactions(transactions);
        setTxTotal(count);
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

  const handleManageTransaction = async (txId: string, action: 'REFUND' | 'RELEASE') => {
     if (!confirm(`Are you sure you want to ${action === 'REFUND' ? 'refund the buyer' : 'release funds to seller'}? This overrides the escrow.`)) return;
     try {
       await api.adminManageTransaction(txId, action);
       showToast(`Transaction ${action === 'REFUND' ? 'Refunded' : 'Released'}`, 'success');
       loadData();
     } catch (e) {
       showToast("Failed to update transaction", 'error');
     }
  };

  const handleBroadcast = async () => {
     if (!broadcastMessage.title || !broadcastMessage.body) return;
     if (!confirm("Send this push notification to ALL users?")) return;
     try {
        await api.adminBroadcastNotification(broadcastMessage.title, broadcastMessage.body);
        showToast("Broadcast Sent!", 'success');
        setBroadcastMessage({ title: '', body: '' });
     } catch (e) {
        showToast("Failed to send broadcast", 'error');
     }
  };

  const handleResolveReport = async (reportId: string, action: 'DISMISS' | 'DELETE_ITEM', itemId?: string) => {
    if (!window.confirm(action === 'DELETE_ITEM' ? "Are you sure you want to delete this item? This cannot be undone." : "Dismiss this report?")) return;
    try {
      await api.adminResolveReport(reportId, action, itemId);
      setReports(prev => prev.filter(r => r.id !== reportId));
      if (activeTab === 'SUPPORT') setTickets(prev => prev.filter(t => t.id !== reportId));
      showToast("Resolved", 'success');
    } catch (e) {
      showToast("Failed to resolve", 'error');
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

  const toggleUserSelection = (userId: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(userId)) newSet.delete(userId);
    else newSet.add(userId);
    setSelectedUserIds(newSet);
  };

  const handleBulkBan = async () => {
    if (!confirm(`Ban ${selectedUserIds.size} users?`)) return;
    try {
      await Promise.all(Array.from(selectedUserIds).map(id => api.adminBanUser(id, true)));
      showToast("Bulk ban complete", 'success');
      setSelectedUserIds(new Set());
      loadData();
    } catch (e: any) {
      showToast("Bulk action failed", 'error');
    }
  };

  const handleCommandAction = (action: string) => {
    if (action === 'goto_users') setActiveTab('USERS');
    if (action === 'goto_finance') setActiveTab('TRANSACTIONS');
    if (action === 'goto_settings') setActiveTab('SETTINGS');
    if (action === 'broadcast') { setActiveTab('SETTINGS'); setTimeout(() => document.getElementById('broadcast-box')?.scrollIntoView({behavior: 'smooth'}), 100); }
    if (action === 'export_data') { exportToCSV(allUsers, 'users_export'); showToast("Exporting data...", 'info'); }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans overflow-hidden">
      {inspectUserId && <UserDetailModal userId={inspectUserId} onClose={() => setInspectUserId(null)} />}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} onAction={handleCommandAction} />
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)} />}

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
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: Activity, color: 'text-blue-400' },
            { id: 'TRANSACTIONS', label: 'Financials', icon: DollarSign, color: 'text-green-400' },
            { id: 'USERS', label: 'Users', icon: Users, color: 'text-purple-400' },
            { id: 'COLLEGES', label: 'Colleges', icon: School, color: 'text-emerald-400' },
            { id: 'VERIFICATIONS', label: 'Approvals', icon: ShieldCheck, color: 'text-orange-400', count: pendingUsers.length },
            { id: 'REPORTS', label: 'Moderation', icon: Flag, color: 'text-red-400', count: reports.length },
            { id: 'SUPPORT', label: 'Support', icon: LifeBuoy, color: 'text-cyan-400', count: tickets.length },
            { id: 'SETTINGS', label: 'System', icon: Settings, color: 'text-slate-400' },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={18} className={item.color} />
              {item.label}
              {item.count ? <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{item.count}</span> : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
             <Command size={12} /> <span className="font-mono">Cmd+K</span> to Search
          </div>
          <button onClick={onSwitchToApp} className="w-full flex items-center gap-3 px-4 py-3 text-slate-200 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-bold">
            <ExternalLink size={18} /> Enter Marketplace
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-xl transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen w-full">
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
                {activeTab === 'TRANSACTIONS' && 'Escrow & Financials'}
                {activeTab === 'USERS' && 'User Management'}
                {activeTab === 'COLLEGES' && 'Campus Network'}
                {activeTab === 'VERIFICATIONS' && 'Pending Approvals'}
                {activeTab === 'REPORTS' && 'Content Moderation'}
                {activeTab === 'SUPPORT' && 'Support Tickets'}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                       <p className="text-slate-500 text-xs font-bold uppercase">Total Users</p>
                       <h3 className="text-3xl font-black text-slate-800">{stats.users}</h3>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                       <Users size={24} />
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                       <p className="text-slate-500 text-xs font-bold uppercase">Total Items</p>
                       <h3 className="text-3xl font-black text-slate-800">{stats.items}</h3>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                       <ShoppingBag size={24} />
                    </div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                       <p className="text-slate-500 text-xs font-bold uppercase">Total GMV</p>
                       <h3 className="text-3xl font-black text-slate-800">${stats.gmv.toLocaleString()}</h3>
                    </div>
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                       <DollarSign size={24} />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-80">
                    <h3 className="font-bold mb-4">Growth Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={analytics.chartData}>
                          <defs>
                             <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-80">
                    <h3 className="font-bold mb-4">Categories Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={analytics.categoryData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="p-6 border-b border-slate-100"><h3 className="font-bold">System Logs</h3></div>
                 <div className="max-h-60 overflow-y-auto">
                    {logs.map((log, i) => (
                       <div key={i} className="p-4 border-b border-slate-50 last:border-0 text-sm flex justify-between">
                          <span>{log.message}</span>
                          <span className="text-slate-400 text-xs">{new Date(log.created_at as string).toLocaleString()}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'USERS' && (
           <div className="space-y-4 animate-slide-up">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                 <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-2">
                    {selectedUserIds.size > 0 && (
                       <button onClick={handleBulkBan} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors">
                          Ban Selected ({selectedUserIds.size})
                       </button>
                    )}
                    <button onClick={() => exportToCSV(allUsers, 'users')} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors">
                       <Download size={16} /> Export
                    </button>
                 </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                       <tr>
                          <th className="p-4 w-10">
                             <div className="w-4 h-4 border border-slate-300 rounded"></div>
                          </th>
                          <th className="p-4">User</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">College</th>
                          <th className="p-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {allUsers.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                             <td className="p-4">
                                <button onClick={() => toggleUserSelection(u.id)}>
                                   {selectedUserIds.has(u.id) ? <CheckSquare size={18} className="text-slate-900"/> : <Square size={18} className="text-slate-300"/>}
                                </button>
                             </td>
                             <td className="p-4 flex items-center gap-3">
                                <img src={u.avatar_url} className="w-8 h-8 rounded-full bg-slate-200" />
                                <div>
                                   <p className="font-bold text-slate-800">{u.full_name}</p>
                                   <p className="text-xs text-slate-500">{u.email}</p>
                                </div>
                             </td>
                             <td className="p-4">
                                {u.banned ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Banned</span> : <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span>}
                             </td>
                             <td className="p-4 text-slate-600">{u.college}</td>
                             <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                   <button onClick={() => setInspectUserId(u.id)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"><Eye size={16}/></button>
                                   <button onClick={() => handleBanUser(u.id, u.banned)} className={`p-2 rounded-lg ${u.banned ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                                      <Ban size={16}/>
                                   </button>
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 
                 <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                    <span className="text-xs text-slate-500">Showing {allUsers.length} of {usersTotal} users</span>
                    <div className="flex gap-2">
                       <button onClick={() => setUsersPage(Math.max(0, usersPage - 1))} disabled={usersPage === 0} className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50"><ChevronLeft size={16}/></button>
                       <button onClick={() => setUsersPage(usersPage + 1)} disabled={allUsers.length < USERS_PER_PAGE} className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50"><ChevronRight size={16}/></button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'TRANSACTIONS' && (
           <div className="space-y-4 animate-slide-up">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                       <tr>
                          <th className="p-4">Item</th>
                          <th className="p-4">Buyer</th>
                          <th className="p-4">Seller</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {allTransactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                             <td className="p-4 font-medium text-slate-800">{tx.item?.title || 'Unknown'}</td>
                             <td className="p-4 text-slate-600">{tx.buyer?.full_name}</td>
                             <td className="p-4 text-slate-600">{tx.seller?.full_name}</td>
                             <td className="p-4 font-bold">${tx.amount}</td>
                             <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                   {tx.status}
                                </span>
                             </td>
                             <td className="p-4 text-right">
                                {tx.status === 'PENDING' && (
                                   <div className="flex justify-end gap-2">
                                      <button onClick={() => handleManageTransaction(tx.id, 'RELEASE')} className="text-green-600 font-bold text-xs hover:underline">Release</button>
                                      <button onClick={() => handleManageTransaction(tx.id, 'REFUND')} className="text-red-600 font-bold text-xs hover:underline">Refund</button>
                                   </div>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                    <span className="text-xs text-slate-500">Showing {allTransactions.length} of {txTotal}</span>
                    <div className="flex gap-2">
                       <button onClick={() => setTxPage(Math.max(0, txPage - 1))} disabled={txPage === 0} className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50"><ChevronLeft size={16}/></button>
                       <button onClick={() => setTxPage(txPage + 1)} disabled={allTransactions.length < USERS_PER_PAGE} className="p-2 bg-white border border-slate-200 rounded-lg disabled:opacity-50"><ChevronRight size={16}/></button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'VERIFICATIONS' && (
           <div className="grid grid-cols-1 gap-4 animate-slide-up">
              {pendingUsers.length === 0 ? (
                 <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <ShieldCheck size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No pending verifications</p>
                 </div>
              ) : (
                 pendingUsers.map(user => (
                    <VerificationCard key={user.id} user={user} onVerify={handleVerify} />
                 ))
              )}
           </div>
        )}

        {activeTab === 'COLLEGES' && (
           <div className="space-y-6 animate-slide-up">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-4">{isEditingCollege ? 'Edit College' : 'Add New College'}</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="College Name" value={newCollege.name} onChange={e => setNewCollege({...newCollege, name: e.target.value})} className="px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                    <input type="text" placeholder="Email Domain (e.g. ucla.edu)" value={newCollege.domain} onChange={e => setNewCollege({...newCollege, domain: e.target.value})} className="px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                    <input type="number" placeholder="Latitude" value={newCollege.latitude} onChange={e => setNewCollege({...newCollege, latitude: e.target.value})} className="px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                    <input type="number" placeholder="Longitude" value={newCollege.longitude} onChange={e => setNewCollege({...newCollege, longitude: e.target.value})} className="px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                 </div>
                 <div className="flex gap-2 mt-4">
                    <button onClick={handleSaveCollege} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">Save College</button>
                    {isEditingCollege && <button onClick={() => { setIsEditingCollege(false); setNewCollege({id: '', name: '', domain: '', latitude: '', longitude: ''}); }} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancel</button>}
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {colleges.map(c => (
                    <div key={c.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group">
                       <div>
                          <h4 className="font-bold text-slate-800">{c.name}</h4>
                          <p className="text-xs text-slate-500">@{c.domain}</p>
                       </div>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditCollege(c)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit2 size={16}/></button>
                          <button onClick={() => handleDeleteCollege(c.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'REPORTS' && (
           <div className="space-y-4 animate-slide-up">
              {reports.length === 0 ? <div className="text-center py-20 text-slate-400">No active reports.</div> : reports.map(report => (
                 <div key={report.id} className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-2">
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">Report</span>
                          <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString()}</span>
                       </div>
                       <p className="font-bold text-slate-800 mb-1">Item ID: {report.itemId || 'N/A'} {report.item?.title && `(${report.item.title})`}</p>
                       <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{report.reason}</p>
                    </div>
                    <div className="flex flex-col gap-2 justify-center">
                       <button onClick={() => handleResolveReport(report.id, 'DELETE_ITEM', report.itemId)} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700">Delete Item</button>
                       <button onClick={() => handleResolveReport(report.id, 'DISMISS')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200">Dismiss</button>
                    </div>
                 </div>
              ))}
           </div>
        )}

        {activeTab === 'SUPPORT' && (
           <div className="space-y-4 animate-slide-up">
              {tickets.length === 0 ? <div className="text-center py-20 text-slate-400">No open tickets.</div> : tickets.map(ticket => (
                 <div key={ticket.id} className="bg-white p-6 rounded-2xl border border-cyan-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center font-bold">{ticket.reporter?.full_name[0]}</div>
                          <div>
                             <p className="font-bold text-slate-800">{ticket.reporter?.full_name}</p>
                             <p className="text-xs text-slate-500">{ticket.reporter?.email}</p>
                          </div>
                       </div>
                       <button onClick={() => handleResolveReport(ticket.id, 'DISMISS')} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <p className="text-sm text-slate-700 mt-4 bg-slate-50 p-4 rounded-xl">{ticket.reason}</p>
                    <div className="mt-4 flex gap-2">
                       <a href={`mailto:${ticket.reporter?.email}`} className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-bold text-sm hover:bg-cyan-700 inline-flex items-center gap-2">
                          <ExternalLink size={14}/> Reply via Email
                       </a>
                       <button onClick={() => handleResolveReport(ticket.id, 'DISMISS')} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-200">Close Ticket</button>
                    </div>
                 </div>
              ))}
           </div>
        )}

        {activeTab === 'SETTINGS' && (
           <div className="max-w-2xl space-y-6 animate-slide-up">
              
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-indigo-100" id="broadcast-box">
                 <h3 className="font-bold text-xl text-indigo-900 mb-6 flex items-center gap-2"><Megaphone size={24} /> Broadcast Notification</h3>
                 <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Title (e.g. Safety Alert)" 
                      className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={broadcastMessage.title}
                      onChange={e => setBroadcastMessage({...broadcastMessage, title: e.target.value})}
                    />
                    <textarea 
                      placeholder="Message body sent to all active users..." 
                      className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                      value={broadcastMessage.body}
                      onChange={e => setBroadcastMessage({...broadcastMessage, body: e.target.value})}
                    />
                    <button 
                      onClick={handleBroadcast}
                      disabled={!broadcastMessage.title || !broadcastMessage.body}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                       Send Push Notification
                    </button>
                 </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2"><Layers size={24} className="text-slate-400" /> Module Configuration</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(moduleFlags).map((mod) => (
                       <div key={mod} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <span className="font-bold text-slate-700 text-sm">{mod}</span>
                          <button onClick={() => handleSaveModules({...moduleFlags, [mod]: !moduleFlags[mod]})} className={`p-1 rounded-full transition-colors ${moduleFlags[mod] ? 'text-green-500' : 'text-slate-300'}`}>
                             {moduleFlags[mod] ? <ToggleRight size={32} fill="currentColor" /> : <ToggleLeft size={32} />}
                          </button>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                 <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2"><Settings size={24} className="text-slate-400" /> App Configuration</h3>
                 <div className="space-y-6">
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-between">
                       <div>
                          <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2"><Wrench size={16}/> Maintenance Mode</h4>
                          <p className="text-xs text-amber-700">Lock app access for non-admins</p>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={appSettings.maintenance_mode === 'true'} onChange={(e) => { const val = e.target.checked ? 'true' : 'false'; setAppSettings(prev => ({...prev, maintenance_mode: val})); handleSaveSetting('maintenance_mode', val); }} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                       </label>
                    </div>

                    <div>
                       <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Platform Fee (%)</label>
                       <div className="flex gap-3">
                          <input type="number" value={appSettings.transaction_fee_percent} onChange={(e) => setAppSettings(prev => ({ ...prev, transaction_fee_percent: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="e.g. 5" />
                          <button onClick={() => handleSaveSetting('transaction_fee_percent', appSettings.transaction_fee_percent)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold"><Save size={18} /></button>
                       </div>
                    </div>

                    <div>
                       <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Announcement Banner</label>
                       <div className="flex gap-3 mb-2">
                          <input type="text" value={appSettings.global_banner_text} onChange={(e) => setAppSettings(prev => ({ ...prev, global_banner_text: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                          <button onClick={() => handleSaveSetting('global_banner_text', appSettings.global_banner_text)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold"><Save size={18} /></button>
                       </div>
                       <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={appSettings.global_banner_active === 'true'} onChange={(e) => { const val = e.target.checked ? 'true' : 'false'; setAppSettings(prev => ({...prev, global_banner_active: val})); handleSaveSetting('global_banner_active', val); }} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                          Show Banner on Home Screen
                       </label>
                    </div>

                    <div>
                       <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Banned Keywords (Auto-Flag)</label>
                       <div className="flex gap-3">
                          <input type="text" placeholder="scam, fake, illegal..." value={appSettings.banned_keywords} onChange={(e) => setAppSettings(prev => ({ ...prev, banned_keywords: e.target.value }))} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-sm" />
                          <button onClick={() => handleSaveSetting('banned_keywords', appSettings.banned_keywords)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold"><Save size={18} /></button>
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
