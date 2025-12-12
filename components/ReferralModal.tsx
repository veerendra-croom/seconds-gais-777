
import React, { useState } from 'react';
import { X, Copy, Gift, Share2, Users, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import { useToast } from './Toast';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose, user }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate a deterministic code if one doesn't exist
  const referralCode = user.referralCode || (user.name.split(' ')[0].toUpperCase() + user.id.slice(0, 4).toUpperCase());
  const referralLink = `https://seconds.app/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast("Referral link copied!", 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Seconds!',
          text: `Buy & sell safely on campus. Use my code ${referralCode} for $5 credit!`,
          url: referralLink
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors z-10 text-white"
        >
          <X size={20} />
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 p-8 text-white text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
           
           <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/30">
              <Gift size={32} className="text-white" />
           </div>
           <h2 className="text-2xl font-black mb-1">Invite Friends</h2>
           <p className="text-pink-100 font-medium text-sm">Get $5 for every friend who joins and verifies their ID.</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           {/* Code Box */}
           <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Code</span>
              <div className="flex items-center gap-2 mb-4">
                 <span className="text-3xl font-black text-slate-800 tracking-widest">{referralCode}</span>
              </div>
              
              <div className="flex gap-2 w-full">
                 <button 
                   onClick={handleCopy}
                   className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                 >
                   {copied ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16} />}
                   {copied ? 'Copied' : 'Copy Link'}
                 </button>
                 <button 
                   onClick={handleShare}
                   className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                 >
                   <Share2 size={16} /> Share
                 </button>
              </div>
           </div>

           {/* Stats */}
           <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                 <Users size={16} className="text-primary-500" /> Your Impact
              </h3>
              <div className="flex gap-3">
                 <div className="flex-1 bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <p className="text-2xl font-black text-blue-600">{user.referralsCount || 0}</p>
                    <p className="text-[10px] font-bold text-blue-400 uppercase">Friends Joined</p>
                 </div>
                 <div className="flex-1 bg-green-50 p-3 rounded-xl border border-green-100">
                    <p className="text-2xl font-black text-green-600">${(user.referralsCount || 0) * 5}</p>
                    <p className="text-[10px] font-bold text-green-400 uppercase">Earned</p>
                 </div>
              </div>
           </div>

           <p className="text-[10px] text-center text-slate-400 leading-relaxed">
              Credits are applied to your Seconds Wallet automatically once your friend completes their ID verification.
           </p>
        </div>
      </div>
    </div>
  );
};
