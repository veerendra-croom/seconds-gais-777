
import React from 'react';

export const SplashView: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background FX */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-slate-900 to-slate-800 rounded-[32px] flex items-center justify-center shadow-2xl shadow-slate-900/30 mb-8 animate-float">
          <span className="text-5xl font-black text-white tracking-tighter">S</span>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Seconds
          </h1>
          <p className="text-slate-500 font-medium tracking-wide text-sm uppercase animate-slide-up" style={{ animationDelay: '0.2s' }}>
            The Campus Marketplace
          </p>
        </div>

        <div className="mt-12 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-900 w-1/3 animate-[shimmer_1s_infinite_linear]"></div>
        </div>
      </div>
    </div>
  );
};
