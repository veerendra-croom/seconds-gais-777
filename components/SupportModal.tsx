
import React, { useState } from 'react';
import { X, HelpCircle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, userId }) => {
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Reuse the report system but mark as support
      await api.createReport({
        reporterId: userId,
        itemId: 'SUPPORT_TICKET', // Special ID for support
        reason: `[SUPPORT: ${category}] ${message}`
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {success ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Ticket Sent!</h2>
            <p className="text-slate-500">Our support team will contact you shortly.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="font-bold text-lg text-indigo-900 flex items-center gap-2">
                <HelpCircle size={20} /> Help & Support
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                <X size={20} className="text-indigo-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Topic</label>
                <select 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>General Inquiry</option>
                  <option>Account Issue</option>
                  <option>Payment Dispute</option>
                  <option>Bug Report</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Message</label>
                <textarea 
                  required
                  placeholder="Describe your issue..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Send Ticket <Send size={18} className="ml-2" /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
