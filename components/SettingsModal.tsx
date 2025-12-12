
import React from 'react';
import { X, Bell, Lock, Shield, Database, ChevronRight, UserCog } from 'lucide-react';
import { useToast } from './Toast';
import { supabase } from '../services/supabaseClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onNavigate?: (view: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, userEmail, onNavigate }) => {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleNav = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
      onClose();
    }
  };

  const handleToggle = (setting: string) => {
    showToast(`${setting} updated`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-xl text-slate-900">Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
           <div className="p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Account & Security</h4>
              <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                 <button 
                   onClick={() => handleNav('SECURITY_SETTINGS')}
                   className="w-full flex items-center gap-4 p-4 hover:bg-slate-100 transition-colors border-b border-slate-100"
                 >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-slate-100">
                       <Lock size={18} />
                    </div>
                    <div className="flex-1 text-left">
                       <p className="font-bold text-slate-800 text-sm">Login & Security</p>
                       <p className="text-xs text-slate-500">2FA, Active Sessions, Password</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                 </button>
                 
                 <button 
                   onClick={() => handleNav('DATA_PRIVACY')}
                   className="w-full flex items-center gap-4 p-4 hover:bg-slate-100 transition-colors"
                 >
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-slate-100">
                       <Database size={18} />
                    </div>
                    <div className="flex-1 text-left">
                       <p className="font-bold text-slate-800 text-sm">Data & Privacy</p>
                       <p className="text-xs text-slate-500">Download data, Delete account</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                 </button>
              </div>
           </div>

           <div className="p-4 pt-0">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Preferences</h4>
              <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                 <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-slate-100">
                          <Bell size={18} />
                       </div>
                       <div>
                          <p className="font-bold text-slate-800 text-sm">Push Notifications</p>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" defaultChecked className="sr-only peer" onChange={() => handleToggle('Notifications')} />
                       <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                 </div>
                 
                 <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-sm border border-slate-100">
                          <UserCog size={18} />
                       </div>
                       <div>
                          <p className="font-bold text-slate-800 text-sm">Public Profile</p>
                          <p className="text-[10px] text-slate-500">Allow others to find you</p>
                       </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                       <input type="checkbox" defaultChecked className="sr-only peer" onChange={() => handleToggle('Visibility')} />
                       <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
