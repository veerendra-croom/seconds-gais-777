
import React, { useState } from 'react';
import { ChevronLeft, ShieldCheck, Mail, Globe, Users, Send, Loader2, CheckCircle2, Zap, Heart, Search, ArrowRight, FileText, Lock, AlertTriangle } from 'lucide-react';
import { ModuleType, UserProfile } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface StaticPagesProps {
  type: ModuleType;
  onBack: () => void;
  user?: UserProfile | null;
}

const MeshGradient: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-pink-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-violet-600/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>
    </div>
  );
};

export const StaticPages: React.FC<StaticPagesProps> = ({ type, onBack, user }) => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (user) {
        // Authenticated users send a report ticket
        await api.createReport({
          reporterId: user.id,
          itemId: 'SUPPORT_TICKET', // Using reserved ID for support tickets
          reason: `[CONTACT_FORM] From: ${contactForm.name} (${contactForm.email}) - Message: ${contactForm.message}`
        });
      } else {
        await api.invokeFunction('send-email', {
           email: 'admin@seconds.app', 
           type: 'ALERT',
           message: `New Guest Inquiry from ${contactForm.name} (${contactForm.email}): ${contactForm.message}`
        });
      }
      setSent(true);
    } catch (err) {
      console.error(err);
      showToast("Failed to send message. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const PageHeader = ({ title, subtitle, icon: Icon }: any) => (
    <div className="relative pt-12 pb-16 px-6 text-center overflow-hidden">
       <MeshGradient />
       <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
             <Icon size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">{title}</h1>
          <p className="text-lg text-slate-600 max-w-lg font-medium leading-relaxed">{subtitle}</p>
       </div>
    </div>
  );

  const renderContent = () => {
    switch (type) {
      case 'ABOUT':
        return (
          <div className="animate-fade-in">
             <PageHeader 
                title="Our Mission" 
                subtitle="Building a sustainable, trusted student economy where resources are shared, not wasted."
                icon={Globe}
             />
             
             <div className="max-w-4xl mx-auto px-6 pb-20 space-y-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                   <div className="space-y-6">
                      <h2 className="text-3xl font-black text-slate-900">Sustainability First</h2>
                      <p className="text-slate-600 leading-relaxed text-lg">
                         Every semester, tons of usable goods are discarded. We're changing that by making it effortless to recirculate items within the campus ecosystem. By buying used, you save money and the planet.
                      </p>
                      <div className="flex gap-4">
                         <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                            <Heart size={16} fill="currentColor" /> Eco-Friendly
                         </div>
                      </div>
                   </div>
                   <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-[40px] aspect-square shadow-2xl p-8 flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                      <Globe size={120} className="text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-700" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                   <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[40px] aspect-square shadow-2xl p-8 flex items-center justify-center relative overflow-hidden group order-2 md:order-1">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                      <Users size={120} className="text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-700" />
                   </div>
                   <div className="space-y-6 order-1 md:order-2">
                      <h2 className="text-3xl font-black text-slate-900">Community Trust</h2>
                      <p className="text-slate-600 leading-relaxed text-lg">
                         Strangers shouldn't be scary. By verifying every single user via University ID, we create a closed network of accountability and safety. You know exactly who you're dealing with.
                      </p>
                      <div className="flex gap-4">
                         <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                            <ShieldCheck size={16} /> Verified Only
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'SAFETY':
        return (
          <div className="animate-fade-in">
             <PageHeader 
                title="Safety Center" 
                subtitle="Your security is our top priority. Learn how we keep the community safe."
                icon={ShieldCheck}
             />
             
             <div className="max-w-3xl mx-auto px-6 pb-20">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-12 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                   <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <Zap className="text-amber-500" fill="currentColor" /> Golden Rules
                   </h3>
                   <ul className="space-y-4">
                      {[
                        "Always meet in public, well-lit areas on campus.",
                        "Inspect items thoroughly before releasing payment.",
                        "Keep all communication inside the Seconds app.",
                        "Never share your password or verification codes.",
                        "Report suspicious behavior immediately."
                      ].map((rule, i) => (
                        <li key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                           <div className="bg-white p-1 rounded-full shadow-sm text-green-500 mt-0.5"><CheckCircle2 size={16} /></div>
                           <span className="font-bold text-slate-700">{rule}</span>
                        </li>
                      ))}
                   </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                      <ShieldCheck size={48} className="mb-4 text-indigo-300" />
                      <h3 className="text-xl font-bold mb-2">Verified IDs</h3>
                      <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                         Every user on Seconds has verified their student status. We manually review ID submissions to keep bots and scammers out.
                      </p>
                   </div>
                   <div className="bg-emerald-600 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                      <Users size={48} className="mb-4 text-emerald-300" />
                      <h3 className="text-xl font-bold mb-2">Safe Zones</h3>
                      <p className="text-emerald-100 text-sm font-medium leading-relaxed">
                         Our AI recommends the safest meeting spots on your specific campus, usually near security or high-traffic areas.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'CAREERS':
        return (
          <div className="animate-fade-in">
             <PageHeader 
                title="Join the Team" 
                subtitle="We're a remote-first team building the future of student commerce."
                icon={Users}
             />
             
             <div className="max-w-2xl mx-auto px-6 pb-20 space-y-4">
                {[
                  { role: "Campus Ambassador", loc: "Remote / On-Campus", tag: "Marketing" },
                  { role: "Senior React Engineer", loc: "Remote (US/EU)", tag: "Engineering" },
                  { role: "Growth Marketing Lead", loc: "New York, NY", tag: "Growth" },
                  { role: "Product Designer", loc: "Remote", tag: "Design" }
                ].map((job, i) => (
                   <div key={i} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex justify-between items-center">
                      <div>
                         <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-primary-600 transition-colors">{job.role}</h3>
                         <div className="flex gap-3 text-sm font-medium text-slate-500">
                            <span>{job.loc}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full self-center"></span>
                            <span>{job.tag}</span>
                         </div>
                      </div>
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                         <ArrowRight size={20} />
                      </div>
                   </div>
                ))}
             </div>
          </div>
        );

      case 'CONTACT':
        return (
          <div className="animate-fade-in">
             <PageHeader 
                title="Contact Support" 
                subtitle="Have a question or issue? We're here to help."
                icon={Mail}
             />
             
             <div className="max-w-lg mx-auto px-6 pb-20">
                {sent ? (
                   <div className="bg-green-50 p-10 rounded-[32px] border border-green-100 text-center animate-zoom-in">
                      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                         <CheckCircle2 size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Message Sent!</h3>
                      <p className="text-slate-600 mb-8 font-medium">We'll get back to you at {contactForm.email} shortly.</p>
                      <button onClick={() => setSent(false)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">Send another</button>
                   </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-6 bg-white p-8 md:p-10 rounded-[32px] shadow-xl border border-slate-100 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
                     
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Name</label>
                        <input 
                          required
                          type="text" 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-all"
                          value={contactForm.name}
                          onChange={e => setContactForm({...contactForm, name: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                        <input 
                          required
                          type="email" 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-all"
                          value={contactForm.email}
                          onChange={e => setContactForm({...contactForm, email: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Message</label>
                        <textarea 
                          required
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 font-medium transition-all h-32 resize-none"
                          value={contactForm.message}
                          onChange={e => setContactForm({...contactForm, message: e.target.value})}
                        />
                     </div>
                     <button 
                       type="submit" 
                       disabled={loading}
                       className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95"
                     >
                       {loading ? <Loader2 className="animate-spin" /> : <>Send Message <Send size={20} /></>}
                     </button>
                  </form>
                )}
             </div>
          </div>
        );

      case 'TERMS':
        return (
          <div className="animate-fade-in max-w-4xl mx-auto px-6 py-12">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-100 rounded-2xl"><FileText size={32} className="text-slate-900"/></div>
                <div>
                   <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
                   <p className="text-slate-500 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
             </div>
             
             <div className="prose prose-slate prose-lg max-w-none bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                <h3>1. Introduction</h3>
                <p>Welcome to Seconds. By accessing our website and mobile application, you agree to be bound by these Terms of Service.</p>
                
                <h3>2. Eligibility</h3>
                <p>You must be a currently enrolled student, faculty, or staff member at a recognized university with a valid <code>.edu</code> email address. Verification via student ID may be required for full access.</p>
                
                <h3>3. User Conduct</h3>
                <p>You agree not to use the platform to:</p>
                <ul>
                   <li>List illegal, dangerous, or academic dishonesty materials (e.g., term papers).</li>
                   <li>Harass, bully, or discriminate against other users.</li>
                   <li>Attempt to circumvent the platform's payment or verification systems.</li>
                </ul>

                <h3>4. Transactions & Fees</h3>
                <p>Seconds acts as a venue. We are not a party to the actual transaction between buyers and sellers. We charge a service fee on successful transactions to cover platform costs.</p>

                <h3>5. Safety</h3>
                <p>We recommend all in-person transactions take place in designated "Safe Zones" on campus. Seconds is not liable for off-platform disputes or safety incidents.</p>

                <h3>6. Termination</h3>
                <p>We reserve the right to suspend or ban any account that violates these terms without prior notice.</p>
             </div>
          </div>
        );

      case 'PRIVACY':
        return (
          <div className="animate-fade-in max-w-4xl mx-auto px-6 py-12">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-slate-100 rounded-2xl"><Lock size={32} className="text-slate-900"/></div>
                <div>
                   <h1 className="text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
                   <p className="text-slate-500 font-medium">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
             </div>
             
             <div className="prose prose-slate prose-lg max-w-none bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex gap-3 text-sm text-blue-800 not-prose">
                   <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                   We do not sell your personal data to third parties. Your student data is used strictly for verification and platform functionality.
                </div>

                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us, including:</p>
                <ul>
                   <li><strong>Identity Data:</strong> Name, university email, and student ID images (for verification only).</li>
                   <li><strong>Transaction Data:</strong> Details of items bought and sold.</li>
                   <li><strong>Usage Data:</strong> How you interact with the app.</li>
                </ul>

                <h3>2. How We Use Your Information</h3>
                <p>We use your data to:</p>
                <ul>
                   <li>Verify your student status.</li>
                   <li>Facilitate payments and payouts via Stripe.</li>
                   <li>Provide customer support and safety alerts.</li>
                </ul>

                <h3>3. Data Security</h3>
                <p>We use enterprise-grade encryption for all data in transit and at rest. Student ID images are stored in a restricted bucket accessible only to authorized administrators for verification purposes.</p>

                <h3>4. Location Data</h3>
                <p>If you opt-in, we use your approximate location to show items relevant to your campus. We do not track your real-time location when the app is closed.</p>
             </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="fixed top-0 left-0 right-0 p-6 z-50 pointer-events-none">
         <button 
           onClick={onBack} 
           className="pointer-events-auto p-3 bg-white/80 backdrop-blur-md hover:bg-white rounded-full shadow-sm text-slate-600 hover:text-slate-900 transition-all border border-slate-200"
         >
            <ChevronLeft size={24} />
         </button>
      </div>
      {renderContent()}
    </div>
  );
};
