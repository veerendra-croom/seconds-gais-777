
import React, { useState } from 'react';
import { X, Flag, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  reporterId: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, itemId, reporterId }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    
    setLoading(true);
    try {
      await api.createReport({
        reporterId,
        itemId,
        reason
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        {success ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Sent</h2>
            <p className="text-slate-500 text-sm">Thank you for keeping our community safe. Admins will review this shortly.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-lg text-red-900 flex items-center gap-2">
                <Flag size={20} /> Report Item
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                <X size={20} className="text-red-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                 <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                 <p className="text-xs text-slate-600 leading-relaxed">
                    False reports may result in account suspension. Please describe the violation clearly (e.g., Scam, Prohibited Item, Harassment).
                 </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Reason</label>
                <textarea 
                  required
                  placeholder="Why are you reporting this?"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none resize-none h-32 text-sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !reason.trim()}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Submit Report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
