
import React from 'react';
import { ChevronLeft, Shield, Lock, Smartphone, Key, AlertTriangle } from 'lucide-react';

export const SecuritySettingsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
        <h1 className="text-xl font-black text-slate-900">Security Settings</h1>
      </header>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-3xl border shadow-sm divide-y divide-slate-50">
          <div className="p-6 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><Lock size={20} /></div>
              <div><h3 className="font-bold text-slate-800">Change Password</h3><p className="text-xs text-slate-500">Update your account password regularly</p></div>
            </div>
            <button className="text-xs font-bold text-primary-600 hover:underline">Update</button>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl shrink-0"><Smartphone size={20} /></div>
              <div><h3 className="font-bold text-slate-800">Two-Factor Auth</h3><p className="text-xs text-slate-500">Add an extra layer of security via SMS</p></div>
            </div>
            <button className="text-xs font-bold text-primary-600 hover:underline">Setup</button>
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
          <div className="flex gap-3 mb-4"><AlertTriangle className="text-red-500" /><h3 className="font-bold text-red-900">Active Sessions</h3></div>
          <p className="text-sm text-red-700 mb-4">You are currently logged in on this iPhone 13. If you see unrecognized devices, sign out of all sessions.</p>
          <button className="text-sm font-black text-red-600 hover:underline">Sign out of all devices</button>
        </div>
      </div>
    </div>
  );
};
