
import React from 'react';
import { ChevronLeft, Database, Download, EyeOff, ShieldCheck, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';

export const DataPrivacyView: React.FC<{ user: UserProfile, onBack: () => void }> = ({ user, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"><ChevronLeft size={24} /></button>
        <h1 className="text-xl font-black text-slate-900">Data & Privacy</h1>
      </header>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-6">
           <div className="flex gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0"><ShieldCheck size={20} /></div>
              <div><h3 className="font-bold text-slate-800">Privacy Policy</h3><p className="text-sm text-slate-500">We do not sell your personal data. Your student info is strictly used for platform verification and safety.</p></div>
           </div>
           <hr className="border-slate-50" />
           <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><Download size={20} /></div>
                <div><h3 className="font-bold text-slate-800">Download Your Data</h3><p className="text-xs text-slate-500">Get a copy of your listings and messages</p></div>
              </div>
              <button className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><ChevronLeft size={16} className="rotate-180" /></button>
           </div>
           <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shrink-0"><EyeOff size={20} /></div>
                <div><h3 className="font-bold text-slate-800">Marketing Cookies</h3><p className="text-xs text-slate-500">Enable personalized campus deals</p></div>
              </div>
              <div className="w-10 h-5 bg-slate-200 rounded-full relative"><div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div></div>
           </div>
        </div>
        <button className="w-full p-6 bg-white border border-red-100 rounded-3xl flex items-center justify-between group hover:bg-red-50 transition-colors">
          <div className="flex gap-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl group-hover:bg-white"><Trash2 size={20} /></div>
            <div className="text-left"><h3 className="font-bold text-slate-800">Request Deletion</h3><p className="text-xs text-slate-500">Permanently delete your profile and data</p></div>
          </div>
        </button>
      </div>
    </div>
  );
};
