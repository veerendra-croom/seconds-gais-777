
import React, { useState } from 'react';
import { ChevronLeft, ShieldCheck, Mail, FileText, Lock, Send, Loader2, CheckCircle2, Users, Briefcase, Newspaper, Globe } from 'lucide-react';
import { ModuleType } from '../types';

interface StaticPagesProps {
  type: ModuleType;
  onBack: () => void;
}

export const StaticPages: React.FC<StaticPagesProps> = ({ type, onBack }) => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  const renderContent = () => {
    switch (type) {
      case 'TERMS':
        return (
          <div className="prose prose-slate max-w-none">
            <h1 className="text-3xl font-black text-slate-900 mb-6">Terms of Service</h1>
            <p className="lead">Last updated: May 2024</p>
            <p>Welcome to Seconds. By accessing our platform, you agree to these terms.</p>
            <h3>1. Eligibility</h3>
            <p>You must be a currently enrolled student at a recognized university with a valid .edu email address to use the buying and selling features.</p>
            <h3>2. User Conduct</h3>
            <p>Users are responsible for their listings. Prohibited items include illegal goods, weapons, and academic dishonesty materials.</p>
            <h3>3. Transactions</h3>
            <p>Seconds provides a platform for connection. We are not a party to the transactions directly unless specified.</p>
          </div>
        );
      case 'PRIVACY':
        return (
          <div className="prose prose-slate max-w-none">
            <h1 className="text-3xl font-black text-slate-900 mb-6">Privacy Policy</h1>
            <p>Your privacy is paramount. We collect data solely to verify student status and facilitate safe trades.</p>
            <h3>Data Collection</h3>
            <p>We collect your Name, .edu Email, and Student ID image for verification purposes only. ID images are stored securely and accessible only to admins.</p>
            <h3>Location Data</h3>
            <p>We use approximate location data to show items near your campus. We never share your exact real-time location.</p>
          </div>
        );
      case 'SAFETY':
        return (
          <div className="prose prose-slate max-w-none">
            <h1 className="text-3xl font-black text-slate-900 mb-6">Safety Guidelines</h1>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-8 not-prose">
               <h3 className="font-bold text-blue-900 flex items-center gap-2 mb-2"><ShieldCheck/> Top Tip</h3>
               <p className="text-blue-700 text-sm">Always meet in public, well-lit areas on campus (e.g., Library, Student Center).</p>
            </div>
            <h3>Best Practices</h3>
            <ul className="space-y-2">
               <li><strong>Verify First:</strong> Only trade with users who have the "Verified Student" badge.</li>
               <li><strong>Stay on App:</strong> Keep all communication within the Seconds chat for your protection.</li>
               <li><strong>Inspect Items:</strong> Check items thoroughly before releasing payment or completing a swap.</li>
            </ul>
          </div>
        );
      case 'ABOUT':
        return (
          <div className="max-w-2xl mx-auto">
             <div className="text-center mb-10">
                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">S</div>
                <h1 className="text-4xl font-black text-slate-900 mb-4">Our Mission</h1>
                <p className="text-xl text-slate-500 leading-relaxed">
                   To build a sustainable, trusted student economy where resources are shared, not wasted.
                </p>
             </div>
             
             <div className="space-y-12">
                <div className="flex gap-6">
                   <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0"><Globe size={24}/></div>
                   <div>
                      <h3 className="font-bold text-xl text-slate-900 mb-2">Sustainability First</h3>
                      <p className="text-slate-600">Every semester, tons of usable goods are discarded. We're changing that by making it effortless to recirculate items within the campus ecosystem.</p>
                   </div>
                </div>
                <div className="flex gap-6">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Users size={24}/></div>
                   <div>
                      <h3 className="font-bold text-xl text-slate-900 mb-2">Community Trust</h3>
                      <p className="text-slate-600">Strangers shouldn't be scary. By verifying every single user via University ID, we create a network of accountability and safety.</p>
                   </div>
                </div>
             </div>
          </div>
        );
      case 'CAREERS':
        return (
          <div className="max-w-2xl mx-auto">
             <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-slate-900 mb-4">Join the Team</h1>
                <p className="text-lg text-slate-500">
                   We're a remote-first team building the future of student commerce.
                </p>
             </div>
             
             <div className="space-y-4">
                <div className="p-6 bg-white border border-slate-200 rounded-2xl flex justify-between items-center hover:border-slate-300 transition-colors cursor-pointer group">
                   <div>
                      <h3 className="font-bold text-slate-900">Campus Ambassador</h3>
                      <p className="text-sm text-slate-500">Remote / On-Campus</p>
                   </div>
                   <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-bold group-hover:bg-slate-900 group-hover:text-white transition-colors">Apply</div>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-2xl flex justify-between items-center hover:border-slate-300 transition-colors cursor-pointer group">
                   <div>
                      <h3 className="font-bold text-slate-900">Senior React Engineer</h3>
                      <p className="text-sm text-slate-500">Remote (US/EU)</p>
                   </div>
                   <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-bold group-hover:bg-slate-900 group-hover:text-white transition-colors">Apply</div>
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-2xl flex justify-between items-center hover:border-slate-300 transition-colors cursor-pointer group">
                   <div>
                      <h3 className="font-bold text-slate-900">Growth Marketing Lead</h3>
                      <p className="text-sm text-slate-500">New York, NY</p>
                   </div>
                   <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full text-xs font-bold group-hover:bg-slate-900 group-hover:text-white transition-colors">Apply</div>
                </div>
             </div>
          </div>
        );
      case 'PRESS':
        return (
          <div className="max-w-2xl mx-auto">
             <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-slate-900 mb-4">Press & Media</h1>
                <p className="text-lg text-slate-500">Latest news and assets for Seconds.</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                   <span className="font-bold text-slate-400">Brand Assets.zip</span>
                </div>
                <div className="aspect-video bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                   <span className="font-bold text-slate-400">Press Kit.pdf</span>
                </div>
             </div>

             <h3 className="font-bold text-xl text-slate-900 mb-4">In the News</h3>
             <div className="space-y-6">
                <div className="border-l-4 border-slate-900 pl-4">
                   <p className="font-bold text-lg text-slate-800 hover:underline cursor-pointer">Seconds raises $2M seed round to connect campuses</p>
                   <p className="text-sm text-slate-500">TechCrunch • 2 days ago</p>
                </div>
                <div className="border-l-4 border-slate-900 pl-4">
                   <p className="font-bold text-lg text-slate-800 hover:underline cursor-pointer">The student startup saving 10 tons of CO2</p>
                   <p className="text-sm text-slate-500">Forbes • 1 week ago</p>
                </div>
             </div>
          </div>
        );
      case 'CONTACT':
        return (
          <div className="max-w-lg mx-auto">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Contact Support</h1>
                <p className="text-slate-500">We're here to help with any issues or questions.</p>
             </div>
             
             {sent ? (
                <div className="bg-green-50 p-8 rounded-3xl border border-green-100 text-center animate-fade-in">
                   <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent</h3>
                   <p className="text-slate-600 mb-6">We'll get back to you at {contactForm.email} shortly.</p>
                   <button onClick={() => setSent(false)} className="text-sm font-bold text-green-700 hover:underline">Send another</button>
                </div>
             ) : (
               <form onSubmit={handleContactSubmit} className="space-y-4 bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Name</label>
                     <input 
                       required
                       type="text" 
                       className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                       value={contactForm.name}
                       onChange={e => setContactForm({...contactForm, name: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Email</label>
                     <input 
                       required
                       type="email" 
                       className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                       value={contactForm.email}
                       onChange={e => setContactForm({...contactForm, email: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">Message</label>
                     <textarea 
                       required
                       className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none"
                       value={contactForm.message}
                       onChange={e => setContactForm({...contactForm, message: e.target.value})}
                     />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Send Message <Send size={18} className="ml-2"/></>}
                  </button>
               </form>
             )}
          </div>
        );
      default: return null;
    }
  };

  const getHeader = () => {
     switch(type) {
        case 'ABOUT': return 'Company';
        case 'CAREERS': return 'Careers';
        case 'PRESS': return 'Press';
        case 'CONTACT': return 'Support';
        case 'TERMS': return 'Legal';
        case 'PRIVACY': return 'Legal';
        case 'SAFETY': return 'Community';
        default: return 'Page';
     }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans animate-slide-up">
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-10 transition-all">
         <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <button 
              onClick={onBack} 
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors mr-4 active:scale-95"
            >
               <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <span className="font-bold text-slate-500 text-sm uppercase tracking-wider">
               {getHeader()}
            </span>
         </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 py-12">
         {renderContent()}
      </div>
    </div>
  );
};
