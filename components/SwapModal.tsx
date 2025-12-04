
import React, { useState, useEffect } from 'react';
import { X, Repeat, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Item } from '../types';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItemTitle: string;
  userId: string;
  onConfirm: (offeredItemId: string) => Promise<void>;
}

export const SwapModal: React.FC<SwapModalProps> = ({ isOpen, onClose, targetItemTitle, userId, onConfirm }) => {
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
       loadMyItems();
    }
  }, [isOpen]);

  const loadMyItems = async () => {
     try {
       const items = await api.getUserItems(userId);
       // Filter active items only
       setMyItems(items.filter(i => i.status === 'ACTIVE'));
     } catch (e) {
       console.error(e);
     } finally {
       setLoading(false);
     }
  };

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await onConfirm(selectedId);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (e) {
       console.error(e);
       setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {success ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Proposal Sent!</h2>
            <p className="text-slate-500">The owner will receive your swap offer.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Propose Trade</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-purple-50 p-4 rounded-xl mb-6">
                 <p className="text-xs font-bold text-purple-400 uppercase mb-1">Trading For</p>
                 <p className="font-semibold text-purple-900">{targetItemTitle}</p>
              </div>

              <h4 className="font-bold text-slate-700 mb-3">Select item to offer:</h4>
              
              {loading ? (
                <div className="text-center py-8 text-slate-400">Loading your inventory...</div>
              ) : myItems.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                   <p className="text-slate-500 mb-2">You have no active listings.</p>
                   <button onClick={onClose} className="text-purple-600 text-sm font-bold">Post an item first</button>
                </div>
              ) : (
                <div className="space-y-3">
                   {myItems.map(item => (
                     <div 
                       key={item.id}
                       onClick={() => setSelectedId(item.id)}
                       className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                         selectedId === item.id 
                           ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500' 
                           : 'border-slate-200 hover:border-purple-300'
                       }`}
                     >
                       <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 border border-slate-100">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500">Value: ${item.price}</p>
                       </div>
                       {selectedId === item.id && <CheckCircle2 className="text-purple-600" size={20} />}
                     </div>
                   ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={handleSubmit} 
                disabled={submitting || !selectedId}
                className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold shadow-lg hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {submitting ? <Loader2 className="animate-spin" /> : `Send Proposal`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
