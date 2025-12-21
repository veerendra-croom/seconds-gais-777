
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChevronRight, CheckCircle2, Sparkles, Building2, Tag, ShieldCheck } from 'lucide-react';

interface SetupWizardViewProps {
  onComplete: () => void;
  user: UserProfile;
}

export const SetupWizardView: React.FC<SetupWizardViewProps> = ({ onComplete, user }) => {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-6 animate-in fade-in">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        <div className="h-2 bg-slate-100"><div className="h-full bg-primary-500 transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div></div>
        
        <div className="p-10 flex-1 overflow-y-auto">
          {step === 1 && (
            <div className="animate-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Building2 size={32} /></div>
              <h2 className="text-3xl font-black text-slate-900 mb-3 leading-tight">Welcome to {user.college}!</h2>
              <p className="text-slate-500 font-medium mb-8">We've linked your account to the verified student hub. You're ready to trade with peers.</p>
              <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95">Next <ChevronRight size={20} /></button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6"><Tag size={32} /></div>
              <h2 className="text-3xl font-black text-slate-900 mb-3 leading-tight">Pick Favorites</h2>
              <p className="text-slate-500 font-medium mb-8">What are you looking for on campus? We'll tailor your feed.</p>
              <div className="grid grid-cols-2 gap-3 mb-10">
                {['Textbooks', 'Electronics', 'Dorm Gear', 'Clothing', 'Services', 'Events'].map(cat => (
                  <button key={cat} onClick={() => toggleCategory(cat)} className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${categories.includes(cat) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>{cat}</button>
                ))}
              </div>
              <button onClick={() => setStep(3)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95">Continue <ChevronRight size={20} /></button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-bottom-4 text-center">
              <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-8 mx-auto"><ShieldCheck size={48} /></div>
              <h2 className="text-3xl font-black text-slate-900 mb-3">You're All Set!</h2>
              <p className="text-slate-500 font-medium mb-12">Remember to trade in Safe Zones and keep all chats inside Seconds for protection.</p>
              <button onClick={onComplete} className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-green-200 hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-3"><Sparkles size={24} /> Enter Marketplace</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
