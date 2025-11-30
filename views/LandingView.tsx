
import React from 'react';
import { ArrowRight, CheckCircle2, ShoppingBag, ShieldCheck, Users, Globe } from 'lucide-react';

interface LandingViewProps {
  onGetStarted: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">S</div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Seconds</span>
        </div>
        <button 
          onClick={onGetStarted}
          className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-5xl mx-auto pb-12 pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-bold mb-6 tracking-wide uppercase border border-primary-100 animate-fade-in">
          <Globe size={12} />
          Campus Exclusive Marketplace
        </div>
        
        <h1 className="text-4xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
          Your Campus. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Your Economy.</span>
        </h1>
        
        <p className="text-lg text-slate-500 max-w-2xl mb-10 leading-relaxed">
          The trusted platform for students to Buy, Sell, Rent, and Swap within their college community. Safe, verified, and sustainable.
        </p>
        
        <button 
          onClick={onGetStarted}
          className="group relative inline-flex items-center justify-center px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-full overflow-hidden shadow-2xl shadow-primary-900/20 hover:bg-slate-800 transition-all active:scale-95"
        >
          <span className="relative z-10 flex items-center gap-2">
            Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </button>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 w-full px-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Verified Students</h3>
            <p className="text-sm text-slate-500">Every user is verified via their college ID and email. No strangers, just peers.</p>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4">
              <ShoppingBag size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Buy, Sell & Rent</h3>
            <p className="text-sm text-slate-500">Don't just buy. Rent textbooks, swap gadgets, or share resources to save money.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-left">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Community First</h3>
            <p className="text-sm text-slate-500">Chat instantly, meet on campus, and build your reputation within your college.</p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-8 text-center text-slate-400 text-sm">
        &copy; {new Date().getFullYear()} Seconds-App. Built for Students.
      </footer>
    </div>
  );
};
