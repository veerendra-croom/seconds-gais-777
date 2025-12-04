
import React, { useState } from 'react';
import { X, CreditCard, Lock, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle: string;
  price: number;
  onConfirm: () => Promise<void>;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, itemTitle, price, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate payment processing
    setTimeout(async () => {
      try {
        await onConfirm();
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 3000);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {success ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
            <p className="text-slate-500 text-sm mb-4">Your payment is held securely in Escrow until you confirm receipt of the item.</p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-500 font-mono">
               Transaction ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Secure Checkout</h3>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex justify-between items-center mb-2">
                 <div>
                    <p className="text-sm text-slate-500">Total Amount</p>
                    <p className="text-3xl font-bold text-slate-900">${price.toFixed(2)}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-slate-400">For item</p>
                    <p className="font-semibold text-slate-700 truncate max-w-[150px]">{itemTitle}</p>
                 </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                 <ShieldCheck className="text-blue-600 shrink-0" size={24} />
                 <div>
                    <h4 className="font-bold text-blue-800 text-sm">Seconds SafePay™</h4>
                    <p className="text-xs text-blue-700 mt-1">Funds are released to the seller only after you approve the item condition.</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase">Card Number</label>
                    <div className="relative">
                       <CreditCard className="absolute left-3 top-3.5 text-slate-400" size={18} />
                       <input 
                         type="text" 
                         placeholder="0000 0000 0000 0000"
                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400 uppercase">Expiry</label>
                       <input 
                         type="text" 
                         placeholder="MM/YY"
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-center"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400 uppercase">CVC</label>
                       <div className="relative">
                          <Lock className="absolute left-3 top-3.5 text-slate-400" size={16} />
                          <input 
                            type="text" 
                            placeholder="123"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-center"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : `Pay $${price.toFixed(2)}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
