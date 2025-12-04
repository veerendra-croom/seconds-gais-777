
import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ShoppingBag, ShieldCheck, Users, Globe, Zap, Heart, Star, Sparkles, ChevronDown, Mail, Twitter, Instagram, Linkedin } from 'lucide-react';
import { ModuleType } from '../types';
import { useToast } from '../components/Toast';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, color }) => (
  <div className={`p-8 rounded-3xl ${color} border border-slate-100 transition-transform hover:-translate-y-2 duration-300`}>
    <div className="bg-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">
      {desc}
    </p>
  </div>
);

interface StepProps {
  num: string;
  title: string;
  desc: string;
}

const Step: React.FC<StepProps> = ({ num, title, desc }) => (
  <div className="text-white">
    <div className="text-6xl font-black text-slate-800 mb-6 opacity-50">{num}</div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-lg">{desc}</p>
  </div>
);

interface LandingViewProps {
  onGetStarted: () => void;
  onViewPage: (page: ModuleType) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onViewPage }) => {
  const [scrolled, setScrolled] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleComingSoon = () => {
    showToast("This page is under construction.", 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500/30 text-slate-900 overflow-x-hidden">
      
      {/* --- BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[120px]"></div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/50 py-3' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-slate-900 to-slate-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-slate-900/20 transform hover:scale-105 transition-transform">S</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Seconds</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => onViewPage('SAFETY')} className="hidden md:block text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Safety</button>
            <button onClick={() => onViewPage('CONTACT')} className="hidden md:block text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Support</button>
            <button 
              onClick={onGetStarted}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold uppercase tracking-wider text-slate-600 mb-8 shadow-sm animate-fade-in hover:border-indigo-300 transition-colors cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live in 50+ Campuses
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[1.1] mb-8 text-slate-900 drop-shadow-sm">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-x">Economy</span> <br/>
          Of Your Campus.
        </h1>
        
        <p className="text-lg md:text-2xl text-slate-500 max-w-2xl mb-10 leading-relaxed font-medium">
          The exclusive marketplace for students. Buy textbooks, rent gear, swap items, and book services—all within your trusted college network.
        </p>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <button 
            onClick={onGetStarted}
            className="group relative w-full md:w-auto px-8 py-4 bg-slate-900 text-white text-lg font-bold rounded-full overflow-hidden shadow-2xl shadow-slate-900/30 transition-all hover:scale-105 active:scale-95"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              Start Trading Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <button onClick={() => onViewPage('SAFETY')} className="w-full md:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 text-lg font-bold rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all">
            How it works
          </button>
        </div>

        {/* Floating Mockup Elements */}
        <div className="mt-20 relative w-full max-w-4xl mx-auto h-[300px] md:h-[500px] perspective-1000">
           {/* Center Card */}
           <div className="absolute left-1/2 top-0 -translate-x-1/2 w-64 md:w-80 aspect-[9/16] bg-white rounded-[2rem] shadow-2xl border-4 border-slate-900 overflow-hidden transform rotate-0 z-20 animate-float">
              <div className="bg-slate-100 h-full w-full p-4 relative">
                 <div className="h-6 w-32 bg-white rounded-full mx-auto mb-6 shadow-sm"></div>
                 <div className="space-y-4">
                    <div className="bg-white p-3 rounded-2xl shadow-sm flex gap-3">
                       <div className="w-12 h-12 bg-indigo-100 rounded-xl"></div>
                       <div className="flex-1 space-y-2">
                          <div className="h-2 w-20 bg-slate-100 rounded"></div>
                          <div className="h-2 w-12 bg-slate-100 rounded"></div>
                       </div>
                    </div>
                    <div className="aspect-square bg-white rounded-2xl shadow-sm relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-600 opacity-10"></div>
                       <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl">
                          <div className="h-3 w-24 bg-slate-200 rounded mb-2"></div>
                          <div className="flex justify-between">
                             <div className="h-3 w-8 bg-slate-200 rounded"></div>
                             <div className="h-4 w-12 bg-indigo-500 rounded-full"></div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Left Card */}
           <div className="hidden md:block absolute left-20 top-20 w-64 aspect-[9/16] bg-white rounded-[2rem] shadow-xl border border-slate-200 opacity-80 transform -rotate-12 scale-90 z-10 blur-[1px]">
              <div className="bg-slate-50 h-full w-full p-4 flex flex-col justify-end">
                 <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-8 h-8 rounded-full bg-green-100"></div>
                       <div className="h-2 w-20 bg-slate-100 rounded"></div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded mb-1"></div>
                    <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                 </div>
              </div>
           </div>

           {/* Right Card */}
           <div className="hidden md:block absolute right-20 top-20 w-64 aspect-[9/16] bg-white rounded-[2rem] shadow-xl border border-slate-200 opacity-80 transform rotate-12 scale-90 z-10 blur-[1px]">
              <div className="bg-slate-50 h-full w-full p-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="aspect-square bg-white rounded-xl shadow-sm"></div>
                    <div className="aspect-square bg-white rounded-xl shadow-sm"></div>
                    <div className="aspect-square bg-white rounded-xl shadow-sm"></div>
                    <div className="aspect-square bg-white rounded-xl shadow-sm"></div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- TRUST MARQUEE --- */}
      <div className="bg-white border-y border-slate-100 py-10 overflow-hidden relative z-20">
        <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Trusted by students at</p>
        </div>
        <div className="flex gap-16 animate-marquee whitespace-nowrap opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
           {/* Duplicate list for seamless loop */}
           {[...Array(2)].map((_, i) => (
             <React.Fragment key={i}>
                <span className="text-2xl font-bold text-slate-400 flex items-center gap-2"><Globe size={24}/> Stanford</span>
                <span className="text-2xl font-bold text-slate-400 flex items-center gap-2"><Globe size={24}/> MIT</span>
                <span className="text-2xl font-bold text-slate-400 flex items-center gap-2"><Globe size={24}/> Harvard</span>
                <span className="text-2xl font-bold text-slate-400 flex items-center gap-2"><Globe size={24}/> Berkeley</span>
                <span className="text-2xl font-bold text-slate-400 flex items-center gap-2"><Globe size={24}/> Oxford</span>
                <span className="text-2xl font-bold text-slate-400 flex items-center gap-2"><Globe size={24}/> Cambridge</span>
                <span className="text-2xl font-bold text-slate-400 flex items-center gap-2"><Globe size={24}/> Yale</span>
                <span className="text-2xl font-bold text-slate-400 flex items-center gap-2"><Globe size={24}/> Princeton</span>
             </React.Fragment>
           ))}
        </div>
      </div>

      {/* --- VALUE PROPS --- */}
      <section className="py-32 px-6 max-w-7xl mx-auto relative z-20">
         <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">More than just a marketplace.</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Seconds is a complete ecosystem designed for the modern student lifestyle.</p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck size={32} className="text-green-500" />}
              title="Verified Students Only"
              desc="No strangers. Every user is verified via their .edu email and student ID card. Trade with confidence."
              color="bg-green-50"
            />
            <FeatureCard 
              icon={<Zap size={32} className="text-blue-500" />}
              title="Instant Campus Delivery"
              desc="Why wait for shipping? Buy from someone in your dorm and get it in minutes, not days."
              color="bg-blue-50"
            />
            <FeatureCard 
              icon={<Heart size={32} className="text-rose-500" />}
              title="Sustainable Living"
              desc="Reduce waste by recirculating goods within your campus. Track your CO2 savings impact."
              color="bg-rose-50"
            />
         </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section className="bg-slate-900 text-white py-32 px-6 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
         
         <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
               <div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">How Seconds Works</h2>
                  <p className="text-slate-400 text-xl max-w-md">Start trading in 3 simple steps.</p>
               </div>
               <button 
                  onClick={onGetStarted}
                  className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors"
               >
                  Get Started
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               <Step 
                 num="01" 
                 title="Verify & Join" 
                 desc="Sign up with your personal email, then verify your student status with your .edu email and ID." 
               />
               <Step 
                 num="02" 
                 title="List or Browse" 
                 desc="Post unused items in seconds using AI auto-fill, or browse listings from your classmates." 
               />
               <Step 
                 num="03" 
                 title="Meet & Trade" 
                 desc="Chat securely, agree on a safe campus meeting spot, and complete the trade instantly." 
               />
            </div>
         </div>
      </section>

      {/* --- MEGA FOOTER --- */}
      <footer className="bg-white border-t border-slate-200 pt-24 pb-12 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
               <div className="md:col-span-1">
                  <div className="flex items-center gap-2 mb-6">
                     <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-xl">S</div>
                     <span className="text-2xl font-black text-slate-900">Seconds</span>
                  </div>
                  <p className="text-slate-500 mb-6 leading-relaxed">
                     The trusted marketplace for the next generation of students. Safe, sustainable, and simple.
                  </p>
                  <div className="flex gap-4">
                     <button onClick={handleComingSoon} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><Twitter size={18}/></button>
                     <button onClick={handleComingSoon} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><Instagram size={18}/></button>
                     <button onClick={handleComingSoon} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all"><Linkedin size={18}/></button>
                  </div>
               </div>

               <div>
                  <h4 className="font-bold text-slate-900 mb-6">Company</h4>
                  <ul className="space-y-4 text-slate-500 font-medium">
                     <li><button onClick={() => onViewPage('ABOUT')} className="hover:text-primary-600 transition-colors">About Us</button></li>
                     <li><button onClick={() => onViewPage('CAREERS')} className="hover:text-primary-600 transition-colors">Careers</button></li>
                     <li><button onClick={() => onViewPage('PRESS')} className="hover:text-primary-600 transition-colors">Press</button></li>
                     <li><button onClick={handleComingSoon} className="hover:text-primary-600 transition-colors">Partners</button></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold text-slate-900 mb-6">Support</h4>
                  <ul className="space-y-4 text-slate-500 font-medium">
                     <li><button onClick={() => onViewPage('SAFETY')} className="hover:text-primary-600 transition-colors">Safety Center</button></li>
                     <li><button onClick={() => onViewPage('CONTACT')} className="hover:text-primary-600 transition-colors">Contact Us</button></li>
                     <li><button onClick={() => onViewPage('TERMS')} className="hover:text-primary-600 transition-colors">Terms of Service</button></li>
                     <li><button onClick={() => onViewPage('PRIVACY')} className="hover:text-primary-600 transition-colors">Privacy Policy</button></li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold text-slate-900 mb-6">Stay Updated</h4>
                  <p className="text-slate-500 text-sm mb-4">Subscribe to our newsletter for campus updates.</p>
                  <div className="flex gap-2">
                     <div className="relative flex-1">
                        <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
                        <input type="email" placeholder="Email address" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-primary-500 transition-colors"/>
                     </div>
                     <button onClick={handleComingSoon} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-colors"><ArrowRight size={18}/></button>
                  </div>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
               <p>&copy; {new Date().getFullYear()} Seconds Inc. All rights reserved.</p>
               <div className="flex gap-6">
                  <button onClick={() => onViewPage('PRIVACY')} className="hover:text-slate-600">Privacy</button>
                  <button onClick={() => onViewPage('TERMS')} className="hover:text-slate-600">Terms</button>
                  <button onClick={handleComingSoon} className="hover:text-slate-600">Cookies</button>
               </div>
            </div>
         </div>
      </footer>

      {/* --- CUSTOM CSS FOR ANIMATIONS --- */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-20px) translateX(-50%); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};
