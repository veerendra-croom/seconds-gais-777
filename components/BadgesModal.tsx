
import React from 'react';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { Badge } from '../types';
import { AVAILABLE_BADGES } from '../services/badgeService';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedBadges: Badge[];
}

export const BadgesModal: React.FC<BadgesModalProps> = ({ isOpen, onClose, earnedBadges }) => {
  if (!isOpen) return null;

  const earnedIds = new Set(earnedBadges.map(b => b.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
             <h3 className="font-bold text-lg text-slate-900">Your Badges</h3>
             <p className="text-xs text-slate-500">{earnedBadges.length} / {AVAILABLE_BADGES.length} Unlocked</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 grid grid-cols-2 gap-4">
           {AVAILABLE_BADGES.map((badge) => {
             const isUnlocked = earnedIds.has(badge.id);
             const Icon = badge.icon;
             
             return (
               <div 
                 key={badge.id}
                 className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                   isUnlocked ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-60 grayscale'
                 }`}
               >
                 {isUnlocked && (
                   <div className="absolute top-2 right-2 text-green-500">
                      <CheckCircle2 size={16} />
                   </div>
                 )}
                 {!isUnlocked && (
                   <div className="absolute top-2 right-2 text-slate-400">
                      <Lock size={16} />
                   </div>
                 )}
                 
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${isUnlocked ? badge.color : 'bg-slate-200'}`}>
                    <Icon size={24} />
                 </div>
                 
                 <h4 className="font-bold text-slate-800 text-sm mb-1">{badge.name}</h4>
                 <p className="text-xs text-slate-500 leading-snug">{badge.description}</p>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};
