
import React, { useState } from 'react';
import { X, ArrowRight, ShoppingBag, PlusCircle, User, CheckCircle2 } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Welcome to Seconds! 👋",
    desc: "The exclusive marketplace for your campus. Let's show you around in 30 seconds.",
    icon: <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">S</div>,
    color: "bg-slate-900"
  },
  {
    title: "Find What You Need",
    desc: "Browse textbooks, electronics, and dorm essentials sold by verified students at your college.",
    icon: <ShoppingBag size={40} className="text-blue-500" />,
    color: "bg-blue-500"
  },
  {
    title: "Sell in Seconds",
    desc: "Snap a photo, use our AI to auto-fill details, and list your unused items to earn cash instantly.",
    icon: <PlusCircle size={40} className="text-green-500" />,
    color: "bg-green-500"
  },
  {
    title: "Build Your Reputation",
    desc: "Your Profile is your identity. Earn badges, track sustainability impact, and manage your wallet.",
    icon: <User size={40} className="text-purple-500" />,
    color: "bg-purple-500"
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-500 z-10"
        >
          <X size={20} />
        </button>

        {/* Header Graphic */}
        <div className={`h-48 ${step.color} relative flex items-center justify-center transition-colors duration-500`}>
           <div className="absolute inset-0 bg-black/10"></div>
           <div className="bg-white p-6 rounded-full shadow-xl relative z-10 transform transition-all duration-500 scale-100">
              {step.icon}
           </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
           <h2 className="text-2xl font-bold text-slate-800 mb-3 transition-all">{step.title}</h2>
           <p className="text-slate-500 text-sm leading-relaxed mb-8 min-h-[60px]">{step.desc}</p>

           <div className="flex gap-2 justify-center mb-8">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-slate-800' : 'w-2 bg-slate-200'}`} 
                />
              ))}
           </div>

           <button 
             onClick={handleNext}
             className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 group active:scale-95"
           >
             {currentStep === STEPS.length - 1 ? (
               <>Get Started <CheckCircle2 size={18} /></>
             ) : (
               <>Next <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
             )}
           </button>
        </div>
      </div>
    </div>
  );
};
