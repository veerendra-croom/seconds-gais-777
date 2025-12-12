
import React, { useState } from 'react';
import { X, Gavel, Loader2, ArrowUp, AlertCircle } from 'lucide-react';

interface PlaceBidModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle: string;
  currentBid: number;
  onPlaceBid: (amount: number) => Promise<void>;
}

export const PlaceBidModal: React.FC<PlaceBidModalProps> = ({ isOpen, onClose, itemTitle, currentBid, onPlaceBid }) => {
  const [bidAmount, setBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const minBid = currentBid + 1; // Minimum increment of $1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount) || amount < minBid) {
      setError(`Bid must be at least $${minBid}`);
      return;
    }

    setLoading(true);
    try {
      await onPlaceBid(amount);
      setBidAmount('');
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10">
          <X size={20} className="text-slate-500" />
        </button>

        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-8 text-white text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
           <Gavel size={32} className="mx-auto mb-3" />
           <h2 className="text-2xl font-black mb-1">Place Your Bid</h2>
           <p className="text-orange-100 font-medium text-sm truncate">{itemTitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
           <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Current Highest Bid</p>
              <p className="text-3xl font-black text-slate-900">${currentBid}</p>
           </div>

           <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Your Max Bid</label>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                 <input 
                   type="number" 
                   autoFocus
                   min={minBid}
                   step="1"
                   value={bidAmount}
                   onChange={(e) => { setBidAmount(e.target.value); setError(null); }}
                   className="w-full pl-10 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-xl font-bold text-slate-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all placeholder:text-slate-300"
                   placeholder={minBid.toString()}
                 />
              </div>
              {error && (
                 <div className="flex items-center gap-2 text-red-500 text-xs font-bold mt-2">
                    <AlertCircle size={14} /> {error}
                 </div>
              )}
           </div>

           <button 
             type="submit" 
             disabled={loading || !bidAmount}
             className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:shadow-none"
           >
             {loading ? <Loader2 className="animate-spin" /> : <>Confirm Bid <ArrowUp size={20} /></>}
           </button>
           
           <p className="text-center text-[10px] text-slate-400 font-medium">
              You will only be charged if you win the auction.
           </p>
        </form>
      </div>
    </div>
  );
};
