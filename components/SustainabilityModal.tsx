
import React, { useEffect, useState } from 'react';
import { X, Leaf, TrendingUp, Award, Zap, Droplets, Wind, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface SustainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const SustainabilityModal: React.FC<SustainabilityModalProps> = ({ isOpen, onClose, user }) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      api.getLeaderboard().then(data => {
        setLeaderboard(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Mock calculation based on user stats
  const co2Saved = Math.floor((user.savings || 0) * 0.15); // approx 0.15kg per dollar saved on used items
  const waterSaved = Math.floor((user.savings || 0) * 40); // liters
  const treesEquiv = (co2Saved / 20).toFixed(1); // 1 tree absorbs ~20kg co2/year

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header with Impact Gradient */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-8 text-white relative overflow-hidden shrink-0">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
           
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm">
              <X size={20} />
           </button>

           <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/30 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-md">
                 <Leaf size={14} /> Planet Impact
              </div>
              <h2 className="text-4xl font-black tracking-tight mb-1">{co2Saved} kg</h2>
              <p className="text-emerald-100 font-medium">CO₂ Emissions Prevented</p>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                 <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-3">
                    <Droplets size={20} />
                 </div>
                 <p className="text-2xl font-bold text-slate-800">{waterSaved.toLocaleString()}L</p>
                 <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Water Saved</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                 <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center mb-3">
                    <Wind size={20} />
                 </div>
                 <p className="text-2xl font-bold text-slate-800">{treesEquiv}</p>
                 <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Trees Planted Equiv.</p>
              </div>
           </div>

           {/* Leaderboard */}
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Award size={18} className="text-amber-500" /> Campus Leaderboard
                 </h3>
                 <span className="text-xs font-bold text-slate-400 uppercase">{user.college}</span>
              </div>
              <div className="divide-y divide-slate-50">
                 {loading ? (
                    <div className="p-6 text-center text-slate-400">
                       <Loader2 className="animate-spin inline-block mr-2" size={16} /> Loading top savers...
                    </div>
                 ) : leaderboard.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">No data available yet.</div>
                 ) : (
                    leaderboard.map((u, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 flex items-center gap-4 ${u.full_name === user.name ? 'bg-emerald-50/50' : 'hover:bg-slate-50'} transition-colors`}
                      >
                         <div className="w-6 text-center font-black text-slate-300 text-lg">#{idx + 1}</div>
                         <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-10 h-10 rounded-full bg-slate-200 object-cover" alt={u.full_name} />
                         <div className="flex-1">
                            <p className={`text-sm ${u.full_name === user.name ? 'font-black text-emerald-900' : 'font-bold text-slate-700'}`}>{u.full_name}</p>
                            {u.full_name === user.name && <p className="text-[10px] text-emerald-600 font-bold uppercase">That's You!</p>}
                         </div>
                         <div className="text-right">
                            <p className="font-bold text-slate-900">{u.savings}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase">Points</p>
                         </div>
                      </div>
                    ))
                 )}
              </div>
           </div>
           
           <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4 items-center">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                 <Zap size={24} />
              </div>
              <div>
                 <p className="text-sm font-bold text-indigo-900">Did you know?</p>
                 <p className="text-xs text-indigo-700 mt-1">Buying one used textbook saves approximately 2kg of CO₂ compared to buying new.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
