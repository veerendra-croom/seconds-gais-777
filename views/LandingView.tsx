
import React, { useEffect, useState, useRef } from 'react';
import { ArrowRight, CheckCircle2, ShoppingBag, ShieldCheck, Users, Globe, Zap, Heart, Star, Sparkles, ChevronDown, Mail, Twitter, Instagram, Linkedin, Smartphone, Search, Bell, Laptop, BookOpen, Coffee, Camera } from 'lucide-react';
import { ModuleType } from '../types';
import { useToast } from '../components/Toast';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, delay }) => (
  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 animate-slide-up" style={{ animationDelay: delay }}>
    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed font-medium">
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
  <div className="relative pl-8 group cursor-pointer">
    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800 group-hover:bg-indigo-500 transition-colors duration-300"></div>
    <div className="text-5xl font-black text-slate-800 mb-2 opacity-50 group-hover:opacity-100 group-hover:text-white transition-all">{num}</div>
    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
  </div>
);

// --- MESH GRADIENT COMPONENT ---
const MeshGradient: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-pink-600/30 rounded-full blur-[120px] animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-violet-600/30 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-cyan-500/20 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-[0.03]"></div>
    </div>
  );
};

interface LandingViewProps {
  onGetStarted: () => void;
  onViewPage: (page: ModuleType) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onViewPage }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    setMousePos({ x, y });
  };

  const handleComingSoon = () => {
    showToast("This page is under construction.", 'info');
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] font-sans selection:bg-pink-500/30 text-white overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-500/20 group-hover:scale-110 transition-transform duration-300">S</div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:tracking-wide transition-all">Seconds</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6">
               <button onClick={() => onViewPage('SAFETY')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Safety</button>
               <button onClick={() => onViewPage('CONTACT')} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Support</button>
            </div>
            <button 
              onClick={onGetStarted}
              className="bg-white text-[#0B0F19] px-6 py-2.5 rounded-full text-sm font-bold hover:bg-pink-50 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
              Enter App
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section 
        className="relative min-h-screen flex flex-col justify-center pt-32 pb-20 px-6 overflow-hidden"
        onMouseMove={handleMouseMove}
        ref={containerRef}
      >
        <MeshGradient />
        
        <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           
           {/* Text Content */}
           <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-pink-300 mb-8 backdrop-blur-md animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
                Live Campus Network
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500 drop-shadow-2xl animate-slide-up">
                Campus <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500">Commerce</span>
                <span className="text-white">.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-400 max-w-xl mb-10 leading-relaxed font-medium mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                The exclusive marketplace for verified students. Buy, sell, and swap safely within your university ecosystem.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <button 
                  onClick={onGetStarted}
                  className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-lg font-bold rounded-2xl overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(236,72,153,0.4)]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Start Trading <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button onClick={() => onViewPage('SAFETY')} className="w-full sm:w-auto px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white text-lg font-bold rounded-2xl hover:bg-white/10 transition-all">
                  Safety Guide
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                       <img key={i} src={`https://ui-avatars.com/api/?name=User+${i}&background=random`} className="w-10 h-10 rounded-full border-2 border-[#0B0F19]" />
                    ))}
                 </div>
                 <div className="text-left">
                    <div className="flex text-amber-400 gap-0.5">
                       {[1,2,3,4,5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                    </div>
                    <p className="text-xs text-slate-400 font-bold"><span className="text-white">4.9/5</span> from students</p>
                 </div>
              </div>
           </div>

           {/* 3D Visual Interface - ORBITAL COMMERCE DESIGN */}
           <div className="relative h-[600px] w-full perspective-1000 order-1 lg:order-2 hidden md:flex items-center justify-center">
              {/* Main Gradient Blob/Orb */}
              <div className="relative w-[500px] h-[500px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full blur-[80px] opacity-40 animate-pulse"></div>
                  <div className="absolute inset-10 bg-gradient-to-tr from-blue-400 via-teal-400 to-emerald-400 rounded-full blur-[60px] opacity-30 animate-blob"></div>
                  
                  {/* Central Glass Circle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_0_100px_rgba(255,255,255,0.1)] flex items-center justify-center animate-float z-10">
                      <div className="text-center relative">
                          <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 tracking-tighter drop-shadow-xl">S</span>
                          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] mt-4">Universe</p>
                          
                          {/* Orbiting Rings SVG */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] pointer-events-none opacity-30">
                             <svg viewBox="0 0 100 100" className="animate-spin-slow w-full h-full">
                                <circle cx="50" cy="50" r="48" stroke="url(#grad1)" strokeWidth="0.5" fill="none" />
                                <defs>
                                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                                    <stop offset="50%" stopColor="rgba(255,255,255,0.5)" />
                                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                                  </linearGradient>
                                </defs>
                             </svg>
                          </div>
                      </div>
                  </div>

                  {/* Orbiting Item 1: Laptop (Top Right) */}
                  <div className="absolute top-0 right-10 animate-float z-20" style={{ animationDelay: '1s' }}>
                      <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 transform rotate-12 hover:rotate-0 transition-all cursor-pointer hover:scale-110 border border-white/20">
                          <Laptop size={36} className="text-white drop-shadow-md" />
                      </div>
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg text-white">
                          Tech
                      </div>
                  </div>

                  {/* Orbiting Item 2: Books (Bottom Left) */}
                  <div className="absolute bottom-16 left-0 animate-float z-20" style={{ animationDelay: '2s' }}>
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/30 transform -rotate-12 hover:rotate-0 transition-all cursor-pointer hover:scale-110 border border-white/20">
                          <BookOpen size={28} className="text-white drop-shadow-md" />
                      </div>
                       <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold shadow-lg text-white">
                          Books
                      </div>
                  </div>

                  {/* Orbiting Item 3: Coffee (Bottom Right) */}
                  <div className="absolute bottom-8 right-12 animate-float z-20" style={{ animationDelay: '3s' }}>
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-[20px] flex items-center justify-center shadow-2xl shadow-green-500/30 transform rotate-6 hover:rotate-0 transition-all cursor-pointer hover:scale-110 border border-white/20">
                          <Coffee size={24} className="text-white drop-shadow-md" />
                      </div>
                  </div>

                  {/* Orbiting Item 4: Camera (Top Left) */}
                  <div className="absolute top-12 left-4 animate-float z-20" style={{ animationDelay: '0.5s' }}>
                       <div className="w-28 h-28 bg-white/5 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center shadow-2xl group hover:bg-white/10 transition-all">
                          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-inner">
                             <Camera size={32} className="text-white drop-shadow-md" />
                          </div>
                       </div>
                  </div>
              </div>
           </div>
        </div>
      </section>

      {/* --- MARQUEE --- */}
      <div className="py-10 bg-[#0B0F19] border-y border-white/5 overflow-hidden relative z-20 transform -rotate-1 origin-left scale-105">
        <div className="flex gap-20 animate-marquee whitespace-nowrap">
           {[...Array(3)].map((_, i) => (
             <React.Fragment key={i}>
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-900 opacity-50">BUY</span>
                <span className="text-6xl font-black text-white">SELL</span>
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-900 opacity-50">RENT</span>
                <span className="text-6xl font-black text-white">SWAP</span>
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-700 to-slate-900 opacity-50">EARN</span>
             </React.Fragment>
           ))}
        </div>
      </div>

      {/* --- FEATURES GRID --- */}
      <section className="py-32 px-6 max-w-7xl mx-auto relative z-20">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShieldCheck size={32} />}
              title="Verified ID Only"
              desc="No strangers. No bots. We verify every user via their university email and student ID card."
              delay="0s"
            />
            <FeatureCard 
              icon={<Zap size={32} />}
              title="Hyper-Local"
              desc="Why ship? Find what you need within walking distance. Trade instantly between classes."
              delay="0.1s"
            />
            <FeatureCard 
              icon={<Heart size={32} />}
              title="Eco-Impact"
              desc="Reduce waste. Track your carbon footprint savings with every sustainable trade you make."
              delay="0.2s"
            />
         </div>
      </section>

      {/* --- HOW IT WORKS (Timeline) --- */}
      <section className="py-32 px-6 relative overflow-hidden bg-white/[0.02]">
         <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div>
               <div className="sticky top-32">
                  <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
                    Simpler than <br/> <span className="text-pink-500">social media.</span>
                  </h2>
                  <p className="text-xl text-slate-400 mb-10 max-w-md">
                     We stripped away the clutter. No ads, no spam, just pure student-to-student commerce.
                  </p>
                  <button 
                     onClick={onGetStarted}
                     className="bg-white text-[#0B0F19] px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors"
                  >
                     Start Trading
                  </button>
               </div>
            </div>

            <div className="space-y-16 pt-10">
               <Step 
                 num="01" 
                 title="Quick Verify" 
                 desc="Snap a photo of your student ID. Our AI verifies your enrollment in seconds, giving you the 'Verified Student' badge." 
               />
               <Step 
                 num="02" 
                 title="Snap & List" 
                 desc="Take a picture of your textbook or gear. Our AI automatically writes the description and suggests a fair price." 
               />
               <Step 
                 num="03" 
                 title="Safe Meetup" 
                 desc="Chat securely. Agree to meet at a designated 'Campus Safe Zone'. Payment is released only when you're happy." 
               />
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 pt-24 pb-12 px-6 bg-[#0B0F19]">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
            <div className="max-w-sm">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0B0F19] font-black text-xl">S</div>
                  <span className="text-2xl font-bold tracking-tight text-white">Seconds</span>
               </div>
               <p className="text-slate-500 mb-8">
                  The trusted marketplace for the next generation of students. Built for sustainability, designed for safety.
               </p>
               <div className="flex gap-4">
                  <button onClick={handleComingSoon} className="w-10 h-10 rounded-full bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/20 hover:text-white transition-all"><Twitter size={18}/></button>
                  <button onClick={handleComingSoon} className="w-10 h-10 rounded-full bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/20 hover:text-white transition-all"><Instagram size={18}/></button>
                  <button onClick={handleComingSoon} className="w-10 h-10 rounded-full bg-white/5 text-slate-400 flex items-center justify-center hover:bg-white/20 hover:text-white transition-all"><Linkedin size={18}/></button>
               </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
               <div>
                  <h4 className="font-bold text-white mb-6">Company</h4>
                  <ul className="space-y-4 text-slate-500 text-sm font-medium">
                     <li><button onClick={() => onViewPage('ABOUT')} className="hover:text-white transition-colors">About Us</button></li>
                     <li><button onClick={() => onViewPage('CAREERS')} className="hover:text-white transition-colors">Careers</button></li>
                     <li><button onClick={() => onViewPage('PRESS')} className="hover:text-white transition-colors">Press</button></li>
                  </ul>
               </div>
               <div>
                  <h4 className="font-bold text-white mb-6">Support</h4>
                  <ul className="space-y-4 text-slate-500 text-sm font-medium">
                     <li><button onClick={() => onViewPage('SAFETY')} className="hover:text-white transition-colors">Safety Center</button></li>
                     <li><button onClick={() => onViewPage('CONTACT')} className="hover:text-white transition-colors">Contact Us</button></li>
                     <li><button onClick={() => onViewPage('TERMS')} className="hover:text-white transition-colors">Terms of Service</button></li>
                  </ul>
               </div>
            </div>
         </div>
         
         <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center md:text-left text-slate-600 text-xs flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Seconds Inc. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
               <button onClick={() => onViewPage('PRIVACY')} className="hover:text-slate-400">Privacy Policy</button>
               <button onClick={() => onViewPage('TERMS')} className="hover:text-slate-400">Terms of Service</button>
            </div>
         </div>
      </footer>

      {/* --- ANIMATION STYLES --- */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 15s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
