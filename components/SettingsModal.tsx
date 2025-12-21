
import React, { useState, useEffect } from 'react';
import { X, Bell, Lock, Shield, Trash2, Loader2, Save, LogOut, Ban, Unlock } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useToast } from './Toast';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, userEmail }) => {
  const [activeTab, setActiveTab] = useState<'NOTIFICATIONS' | 'SECURITY' | 'PRIVACY' | 'BLOCKED'>('NOTIFICATIONS');
  const [loading, setLoading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    emailNotifs: true,
    pushNotifs: true,
    marketingEmails: false,
    publicEmail: false,
    showOnlineStatus: true
  });

  // Password Change State
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  useEffect(() => {
    if (activeTab === 'BLOCKED') {
       loadBlockedUsers();
    }
  }, [activeTab]);

  const loadBlockedUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
       const blocks = await api.getBlockedUsers(user.id);
       setBlockedUsers(blocks);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      await api.unblockUser(user.id, blockedId);
      setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
      showToast("User unblocked", 'success');
    } catch (e) {
      showToast("Failed to unblock", 'error');
    }
  };

  if (!isOpen) return null;

  const handleToggle = async (key: keyof typeof settings) => {
    const newVal = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newVal }));
    
    // Persist to Supabase Auth Metadata
    try {
      await supabase.auth.updateUser({
        data: { settings: { ...settings, [key]: newVal } }
      });
    } catch (e) {
      console.error("Failed to save setting", e);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast("Passwords do not match", 'error');
      return;
    }
    if (passwords.new.length < 6) {
      showToast("Password must be at least 6 characters", 'error');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      showToast("Password updated successfully", 'success');
      setPasswords({ new: '', confirm: '' });
    } catch (err: any) {
      showToast(err.message || "Failed to update password", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt("Type 'DELETE' to confirm account deletion. This cannot be undone.");
    if (confirmation === 'DELETE') {
       try {
         const { data: { user } } = await supabase.auth.getUser();
         if (user) {
            await api.deleteAccount(user.id);
            showToast("Account deleted.", 'success');
            onClose();
            // App will auto-redirect due to auth state change
         }
       } catch (e) {
         console.error(e);
         showToast("Failed to delete account. Try again later.", 'error');
       }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[600px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6">
           <h3 className="font-bold text-xl text-slate-800 mb-6">Settings</h3>
           <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('NOTIFICATIONS')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'NOTIFICATIONS' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Bell size={18} /> Notifications
              </button>
              <button 
                onClick={() => setActiveTab('SECURITY')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'SECURITY' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Lock size={18} /> Security
              </button>
              <button 
                onClick={() => setActiveTab('PRIVACY')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'PRIVACY' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Shield size={18} /> Privacy
              </button>
              <button 
                onClick={() => setActiveTab('BLOCKED')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold ${activeTab === 'BLOCKED' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Ban size={18} /> Blocked
              </button>
           </nav>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-white">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">
                {activeTab === 'NOTIFICATIONS' && 'Notification Preferences'}
                {activeTab === 'SECURITY' && 'Login & Security'}
                {activeTab === 'PRIVACY' && 'Privacy Controls'}
                {activeTab === 'BLOCKED' && 'Blocked Users'}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-6">
              
              {activeTab === 'NOTIFICATIONS' && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                         <p className="font-bold text-slate-700">Push Notifications</p>
                         <p className="text-xs text-slate-500">Receive alerts on your device for messages and orders</p>
                      </div>
                      <button 
                        onClick={() => handleToggle('pushNotifs')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.pushNotifs ? 'bg-primary-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.pushNotifs ? 'left-7' : 'left-1'}`}></div>
                      </button>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                         <p className="font-bold text-slate-700">Email Alerts</p>
                         <p className="text-xs text-slate-500">Receive summaries at {userEmail}</p>
                      </div>
                      <button 
                        onClick={() => handleToggle('emailNotifs')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.emailNotifs ? 'bg-primary-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.emailNotifs ? 'left-7' : 'left-1'}`}></div>
                      </button>
                   </div>
                </div>
              )}

              {activeTab === 'SECURITY' && (
                <div className="space-y-8">
                   <form onSubmit={handlePasswordChange} className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-500 uppercase">Change Password</h4>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700">New Password</label>
                         <input 
                           type="password" 
                           className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                           value={passwords.new}
                           onChange={e => setPasswords({...passwords, new: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-700">Confirm Password</label>
                         <input 
                           type="password" 
                           className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                           value={passwords.confirm}
                           onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                         />
                      </div>
                      <button 
                        type="submit" 
                        disabled={loading || !passwords.new}
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Update Password'}
                      </button>
                   </form>

                   <div className="pt-8 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-red-500 uppercase mb-4">Danger Zone</h4>
                      <button 
                        onClick={handleDeleteAccount}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} /> Delete Account
                      </button>
                   </div>
                </div>
              )}

              {activeTab === 'PRIVACY' && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                         <p className="font-bold text-slate-700">Public Profile</p>
                         <p className="text-xs text-slate-500">Allow other students to find you by name</p>
                      </div>
                      <button 
                        onClick={() => handleToggle('showOnlineStatus')} 
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.showOnlineStatus ? 'bg-primary-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.showOnlineStatus ? 'left-7' : 'left-1'}`}></div>
                      </button>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                         <p className="font-bold text-slate-700">Show Email Address</p>
                         <p className="text-xs text-slate-500">Display your .edu email on your public profile</p>
                      </div>
                      <button 
                        onClick={() => handleToggle('publicEmail')}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.publicEmail ? 'bg-primary-600' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${settings.publicEmail ? 'left-7' : 'left-1'}`}></div>
                      </button>
                   </div>
                </div>
              )}

              {activeTab === 'BLOCKED' && (
                <div className="space-y-4">
                   {blockedUsers.length === 0 ? (
                      <p className="text-center text-slate-400 py-10">You haven't blocked anyone.</p>
                   ) : blockedUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                         <div className="flex items-center gap-3">
                            <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} className="w-10 h-10 rounded-full" />
                            <span className="font-bold text-slate-800">{user.name}</span>
                         </div>
                         <button 
                           onClick={() => handleUnblock(user.id)}
                           className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center gap-2"
                         >
                           <Unlock size={14} /> Unblock
                         </button>
                      </div>
                   ))}
                </div>
              )}

           </div>
           
           <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={onClose} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800">Cancel</button>
              <button 
                onClick={() => { showToast("Settings saved", 'success'); onClose(); }}
                className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold shadow-md hover:bg-primary-700 flex items-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
