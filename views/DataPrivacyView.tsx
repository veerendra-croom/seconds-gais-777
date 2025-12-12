
import React, { useState } from 'react';
import { ChevronLeft, Download, Trash2, FileText, Database, Loader2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface DataPrivacyViewProps {
  user: UserProfile;
  onBack: () => void;
}

export const DataPrivacyView: React.FC<DataPrivacyViewProps> = ({ user, onBack }) => {
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0); // 0: Idle, 1: Confirm, 2: Final
  const [confirmText, setConfirmText] = useState('');
  const { showToast } = useToast();

  const handleExportData = async () => {
    setExporting(true);
    try {
      // Fetch all relevant user data
      const [items, history, wallet] = await Promise.all([
         api.getUserItems(user.id),
         api.getUserOrders(user.id),
         api.getWalletHistory(user.id)
      ]);

      const exportPackage = {
         profile: user,
         inventory: items,
         orders: history,
         transactions: wallet,
         exportDate: new Date().toISOString()
      };

      // Create downloadable blob
      const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `seconds_data_export_${user.id.substring(0,8)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast("Data export downloaded.", 'success');
    } catch (e) {
      console.error(e);
      showToast("Failed to export data.", 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    
    setDeleting(true);
    try {
       await api.deleteAccount(user.id);
       // App will handle auth state change and redirect
    } catch (e) {
       console.error(e);
       showToast("Failed to delete account. Contact support.", 'error');
       setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Your Data & Privacy</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                 <Database size={24} />
              </div>
              <div>
                 <h2 className="text-lg font-bold text-slate-900">Download Your Data</h2>
                 <p className="text-slate-500 text-sm">Get a copy of everything you've shared with Seconds.</p>
              </div>
           </div>
           
           <div className="bg-slate-50 rounded-xl p-4 mb-6 text-sm text-slate-600 space-y-2">
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> <span>Profile Information</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> <span>Transaction History</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500"/> <span>Inventory & Listings</span></div>
           </div>

           <button 
             onClick={handleExportData}
             disabled={exporting}
             className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
           >
             {exporting ? <Loader2 className="animate-spin" size={18} /> : <><Download size={18} /> Request JSON Archive</>}
           </button>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-red-100 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
           
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center shrink-0">
                 <Trash2 size={24} />
              </div>
              <div>
                 <h2 className="text-lg font-bold text-slate-900">Delete Account</h2>
                 <p className="text-slate-500 text-sm">Permanently remove your data from our servers.</p>
              </div>
           </div>

           {deleteStep === 0 && (
              <button 
                onClick={() => setDeleteStep(1)}
                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
              >
                Start Deletion Process
              </button>
           )}

           {deleteStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                 <div className="bg-red-50 p-4 rounded-xl flex gap-3 text-red-800 text-sm">
                    <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                    <p><strong>Warning:</strong> This action cannot be undone. All your listings, messages, and wallet history will be permanently erased.</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setDeleteStep(0)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                    <button onClick={() => setDeleteStep(2)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700">Continue</button>
                 </div>
              </div>
           )}

           {deleteStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                 <p className="text-sm font-bold text-slate-700">Type <span className="font-mono bg-slate-100 px-1 rounded">DELETE</span> to confirm.</p>
                 <input 
                   type="text" 
                   value={confirmText}
                   onChange={e => setConfirmText(e.target.value)}
                   className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-bold"
                   placeholder="DELETE"
                 />
                 <div className="flex gap-3">
                    <button onClick={() => setDeleteStep(0)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">Cancel</button>
                    <button 
                      onClick={handleDeleteAccount} 
                      disabled={confirmText !== 'DELETE' || deleting}
                      className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                      {deleting ? <Loader2 className="animate-spin" size={18} /> : 'Delete Forever'}
                    </button>
                 </div>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};
