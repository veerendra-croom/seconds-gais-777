
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { X, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, Loader2, Building, AlertCircle } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'HISTORY' | 'WITHDRAW'>('HISTORY');
  const [history, setHistory] = useState<{credits: any[], debits: any[]}>({ credits: [], debits: [] });
  const [loading, setLoading] = useState(true);
  
  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({ bankName: '', accountNo: '' });
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getWalletHistory(user.id);
      setHistory(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (amount > (user.earnings || 0)) {
      setError("Insufficient funds.");
      return;
    }

    setWithdrawLoading(true);
    try {
      await api.withdrawFunds(user.id, amount);
      setSuccess(true);
      onUpdate(); // Update parent profile state
      setTimeout(() => {
        setSuccess(false);
        setWithdrawAmount('');
        onClose();
      }, 2500);
    } catch (e) {
      setError("Withdrawal failed. Please try again.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header / Card */}
        <div className="bg-slate-900 p-6 text-white relative overflow-hidden shrink-0">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
           
           <div className="flex justify-between items-start mb-6 relative z-10">
              <div>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Available Balance</p>
                 <h2 className="text-4xl font-bold tracking-tight">${(user.earnings || 0).toFixed(2)}</h2>
              </div>
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                 <X size={20} />
              </button>
           </div>

           <div className="flex gap-4 relative z-10">
              <button 
                onClick={() => setActiveTab('WITHDRAW')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'WITHDRAW' ? 'bg-white text-slate-900 shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <ArrowUpRight size={16} /> Withdraw
              </button>
              <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <Clock size={16} /> History
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
           {activeTab === 'WITHDRAW' ? (
             <div className="p-6">
                {success ? (
                  <div className="text-center py-10">
                     <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <CheckCircle2 size={32} />
                     </div>
                     <h3 className="text-xl font-bold text-slate-800 mb-2">Withdrawal Initiated</h3>
                     <p className="text-slate-500 text-sm">Your funds are on the way. It may take 2-3 business days to reflect in your bank account.</p>
                  </div>
                ) : (
                  <form onSubmit={handleWithdraw} className="space-y-6">
                     <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <label className="text-xs font-bold text-slate-400 uppercase">Amount to Withdraw</label>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-2xl text-slate-400 font-bold">$</span>
                           <input 
                             type="number" 
                             placeholder="0.00"
                             className="w-full text-3xl font-bold text-slate-800 outline-none placeholder:text-slate-200"
                             value={withdrawAmount}
                             onChange={e => setWithdrawAmount(e.target.value)}
                           />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                           <Building size={16} /> Bank Details
                        </h4>
                        <input 
                          type="text" 
                          placeholder="Bank Name" 
                          required
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                          value={bankInfo.bankName}
                          onChange={e => setBankInfo({...bankInfo, bankName: e.target.value})}
                        />
                        <input 
                          type="text" 
                          placeholder="Account Number / IBAN" 
                          required
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                          value={bankInfo.accountNo}
                          onChange={e => setBankInfo({...bankInfo, accountNo: e.target.value})}
                        />
                     </div>

                     {error && (
                       <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2">
                          <AlertCircle size={14} /> {error}
                       </div>
                     )}

                     <button 
                       type="submit" 
                       disabled={withdrawLoading}
                       className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center disabled:opacity-50"
                     >
                       {withdrawLoading ? <Loader2 className="animate-spin" /> : "Confirm Withdrawal"}
                     </button>
                  </form>
                )}
             </div>
           ) : (
             <div className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase">Recent Activity</h3>
                
                {loading ? (
                   <div className="text-center py-10 text-slate-400">Loading...</div>
                ) : (history.credits.length === 0 && history.debits.length === 0) ? (
                   <div className="text-center py-10 text-slate-400 text-sm">No transaction history.</div>
                ) : (
                   <div className="space-y-3">
                      {history.credits.map((tx) => (
                        <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
                                 <ArrowDownLeft size={20} />
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800 text-sm">{tx.item?.title || 'Service Payment'}</p>
                                 <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="font-bold text-green-600">+${tx.amount}</p>
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">COMPLETED</span>
                           </div>
                        </div>
                      ))}
                      
                      {history.debits.map((tx) => (
                        <div key={tx.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center shrink-0">
                                 <ArrowUpRight size={20} />
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800 text-sm">{tx.item?.title || 'Purchase'}</p>
                                 <p className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="font-bold text-slate-800">-${tx.amount}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                 {tx.status === 'PENDING' ? 'ESCROW' : tx.status}
                              </span>
                           </div>
                        </div>
                      ))}
                   </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
