
import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { ShieldCheck, Users, ShoppingBag, DollarSign, CheckCircle2, XCircle, Loader2, Key, Settings, LogOut } from 'lucide-react';
import { signOut } from '../services/supabaseClient';

interface AdminDashboardProps {
  user: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<any>({ users: 0, items: 0, gmv: 0 });
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VERIFICATIONS' | 'SETTINGS'>('OVERVIEW');
  const [loading, setLoading] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'OVERVIEW') {
        const data = await api.adminGetStats();
        setStats(data);
      } else if (activeTab === 'VERIFICATIONS') {
        const users = await api.adminGetPendingVerifications();
        setPendingUsers(users);
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
            <div className="p-1 bg-blue-500/20 rounded text-blue-400"><DollarSign size={18} /></div>
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('VERIFICATIONS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'VERIFICATIONS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="p-1 bg-orange-500/20 rounded text-orange-400"><Users size={18} /></div>
            Verifications
            {pendingUsers.length > 0 && <span className="ml-auto bg-red-500 text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'SETTINGS' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <div className="p-1 bg-purple-500/20 rounded text-purple-400"><Settings size={18} /></div>
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
            {activeTab === 'OVERVIEW' && 'Platform Overview'}
            {activeTab === 'VERIFICATIONS' && 'Pending ID Approvals'}
            {activeTab === 'SETTINGS' && 'System Settings'}
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Welcome, {user.name}</span>
            <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-300" />
          </div>
        </header>

        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-500 text-sm font-bold uppercase mb-2">Total Users</p>
               <p className="text-4xl font-bold text-slate-800">{loading ? '...' : stats.users}</p>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-500 text-sm font-bold uppercase mb-2">Active Items</p>
               <p className="text-4xl font-bold text-slate-800">{loading ? '...' : stats.items}</p>
             </div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
               <p className="text-slate-500 text-sm font-bold uppercase mb-2">Est. GMV</p>
               <p className="text-4xl font-bold text-slate-800">${loading ? '...' : stats.gmv}</p>
             </div>
          </div>
        )}

        {activeTab === 'VERIFICATIONS' && (
          <div className="space-y-4">
            {pendingUsers.length === 0 && !loading && (
              <div className="text-center py-20 text-slate-400">All caught up! No pending verifications.</div>
            )}
            
            {pendingUsers.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex gap-6">
                <div className="w-1/3 aspect-video bg-slate-100 rounded-xl overflow-hidden relative">
                   {/* In a real app, this URL comes from Supabase Storage securely */}
                   <div className="absolute inset-0 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 m-2 rounded-lg">
                      [ID Card Image Placeholder]
                      {/* <img src={...} /> */}
                   </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800">{u.full_name}</h3>
                  <p className="text-slate-500 mb-4">{u.college} • {u.college_email}</p>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleVerify(u.id, true)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Approve
                    </button>
                    <button 
                      onClick={() => handleVerify(u.id, false)}
                      className="px-6 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 flex items-center gap-2"
                    >
                      <XCircle size={18} /> Reject
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
