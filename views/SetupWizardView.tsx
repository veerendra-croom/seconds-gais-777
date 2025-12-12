
import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShoppingBag, Tag, Sparkles, Loader2 } from 'lucide-react';
import { UserProfile, Category } from '../types';
import { api } from '../services/api';

interface SetupWizardViewProps {
  user: UserProfile;
  onComplete: () => void;
}

export const SetupWizardView: React.FC<SetupWizardViewProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'BUY' | 'SELL' | 'BOTH' | null>(null);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCategoryToggle = (cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleFinish = async () => {
    setLoading(true);
    // Persist preferences (In prod, save to DB 'profiles.preferences' column via API)
    // Here we assume API supports updateProfile with arbitrary json
    try {
        await api.updateProfile(user.id, {
            // Mocking the preferences field update logic
            bio: user.bio || `Interested in ${selectedCats.join(', ')}`, // Fallback usage of bio field to store interests for now
        });
        // Set local flag to not show again
        localStorage.setItem(`setup_wizard_${user.id}`, 'completed');
        setTimeout(() => {
            onComplete();
        }, 800);
    } catch (e) {
        console.error(e);
        onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Progress Bar */}
      <div className="h-1.5 bg-slate-200 w-full">
         <div 
           className="h-full bg-primary-600 transition-all duration-500 ease-out" 
           style={{ width: `${(step / 3) * 100}%` }}
         ></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
         
         {/* STEP 1: ROLE */}
         {step === 1 && (
            <div className="w-full animate-in slide-in-from-right fade-in duration-500">
               <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                     <Sparkles size={32} />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 mb-3">Welcome, {user.name.split(' ')[0]}!</h1>
                  <p className="text-slate-500 text-lg">How do you plan to use Seconds?</p>
               </div>

               <div className="space-y-4">
                  <button 
                    onClick={() => setRole('BUY')}
                    className={`w-full p-6 rounded-3xl border-2 text-left transition-all ${role === 'BUY' ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' : 'border-slate-200 bg-white hover:border-primary-300'}`}
                  >
                     <div className="flex justify-between items-center mb-2">
                        <ShoppingBag className={role === 'BUY' ? 'text-primary-600' : 'text-slate-400'} size={28} />
                        {role === 'BUY' && <CheckCircle2 className="text-primary-600" size={24} />}
                     </div>
                     <h3 className="font-bold text-slate-900 text-lg">I want to buy stuff</h3>
                     <p className="text-slate-500 text-sm">Find deals on textbooks, tech, and dorm gear.</p>
                  </button>

                  <button 
                    onClick={() => setRole('SELL')}
                    className={`w-full p-6 rounded-3xl border-2 text-left transition-all ${role === 'SELL' ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-slate-200 bg-white hover:border-green-300'}`}
                  >
                     <div className="flex justify-between items-center mb-2">
                        <Tag className={role === 'SELL' ? 'text-green-600' : 'text-slate-400'} size={28} />
                        {role === 'SELL' && <CheckCircle2 className="text-green-600" size={24} />}
                     </div>
                     <h3 className="font-bold text-slate-900 text-lg">I want to sell items</h3>
                     <p className="text-slate-500 text-sm">Clear out clutter and earn extra cash.</p>
                  </button>

                  <button 
                    onClick={() => setRole('BOTH')}
                    className={`w-full p-6 rounded-3xl border-2 text-left transition-all ${role === 'BOTH' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-slate-200 bg-white hover:border-purple-300'}`}
                  >
                     <div className="flex justify-between items-center mb-2">
                        <Sparkles className={role === 'BOTH' ? 'text-purple-600' : 'text-slate-400'} size={28} />
                        {role === 'BOTH' && <CheckCircle2 className="text-purple-600" size={24} />}
                     </div>
                     <h3 className="font-bold text-slate-900 text-lg">A bit of both</h3>
                     <p className="text-slate-500 text-sm">I'm here to trade and explore.</p>
                  </button>
               </div>
            </div>
         )}

         {/* STEP 2: INTERESTS */}
         {step === 2 && (
            <div className="w-full animate-in slide-in-from-right fade-in duration-500">
               <div className="text-center mb-8">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">What are you looking for?</h2>
                  <p className="text-slate-500">Pick at least 3 categories to personalize your feed.</p>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  {Object.values(Category).map(cat => (
                     <button
                       key={cat}
                       onClick={() => handleCategoryToggle(cat)}
                       className={`p-4 rounded-2xl font-bold text-sm transition-all border ${
                         selectedCats.includes(cat)
                           ? 'bg-slate-900 text-white border-slate-900 shadow-lg transform scale-[1.02]'
                           : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                       }`}
                     >
                       {cat}
                     </button>
                  ))}
               </div>
            </div>
         )}

         {/* STEP 3: ALL SET */}
         {step === 3 && (
            <div className="w-full text-center animate-in zoom-in fade-in duration-500">
               <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/30">
                  <CheckCircle2 size={48} className="text-white" />
               </div>
               <h2 className="text-3xl font-black text-slate-900 mb-4">You're all set!</h2>
               <p className="text-slate-500 text-lg max-w-xs mx-auto mb-10">
                  Your feed has been customized. Start exploring your campus marketplace now.
               </p>
            </div>
         )}

         {/* Footer Nav */}
         <div className="w-full mt-8">
            {step < 3 ? (
               <button 
                 onClick={() => setStep(prev => prev + 1)}
                 disabled={step === 1 && !role || step === 2 && selectedCats.length < 1}
                 className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
               >
                 Continue <ArrowRight size={20} />
               </button>
            ) : (
               <button 
                 onClick={handleFinish}
                 className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
               >
                 {loading ? <Loader2 className="animate-spin" /> : 'Enter App'}
               </button>
            )}
            
            {step > 1 && step < 3 && (
               <button onClick={() => setStep(prev => prev - 1)} className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 mt-2">
                  Back
               </button>
            )}
         </div>
      </div>
    </div>
  );
};
