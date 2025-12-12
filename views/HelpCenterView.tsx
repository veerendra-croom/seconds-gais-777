
import React, { useState } from 'react';
import { ChevronLeft, Search, ShoppingBag, DollarSign, ShieldCheck, User, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { SupportModal } from '../components/SupportModal';

interface HelpCenterViewProps {
  onBack: () => void;
  userId: string;
}

const FAQS = [
  {
    category: 'Buying',
    questions: [
      { q: "How do I pay for an item?", a: "We use a secure escrow system. When you pay via the app, your funds are held safely. They are only released to the seller after you meet up and confirm the item condition." },
      { q: "What if the item isn't as described?", a: "Do not scan the seller's QR code. You can cancel the order directly in the app for a full refund before the handover is complete." }
    ]
  },
  {
    category: 'Selling',
    questions: [
      { q: "When do I get paid?", a: "Funds are released to your Seconds Wallet immediately after you scan the buyer's QR code during the meetup. You can withdraw to your bank anytime." },
      { q: "Is there a selling fee?", a: "Yes, we charge a small 5% platform fee to cover payment processing and safety features." }
    ]
  },
  {
    category: 'Safety',
    questions: [
      { q: "Where should I meet?", a: "The app recommends 'Safe Zones' on your campus (like libraries or student unions). Always meet in public, well-lit areas." },
      { q: "How do I report a user?", a: "Go to their profile or the chat screen and tap the flag icon. Our admin team reviews reports 24/7." }
    ]
  }
];

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({ onBack, userId }) => {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);

  const toggleOpen = (idx: string) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const filteredFaqs = FAQS.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(search.toLowerCase()) || 
      q.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-slate-900 text-white pt-12 pb-24 px-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft size={24} /></button>
         
         <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-black mb-4">How can we help?</h1>
            <div className="relative">
               <input 
                 type="text" 
                 placeholder="Search for answers..." 
                 className="w-full py-4 pl-12 pr-4 rounded-2xl text-slate-900 outline-none focus:ring-4 focus:ring-primary-500/30"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
         </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-20 space-y-8">
         
         {/* Categories */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShoppingBag, label: 'Buying' },
              { icon: DollarSign, label: 'Selling' },
              { icon: ShieldCheck, label: 'Safety' },
              { icon: User, label: 'Account' },
            ].map((cat, i) => (
               <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-2 hover:-translate-y-1 transition-transform cursor-pointer">
                  <cat.icon size={24} className="text-primary-600" />
                  <span className="font-bold text-xs text-slate-700">{cat.label}</span>
               </div>
            ))}
         </div>

         {/* FAQs */}
         <div className="space-y-6">
            {filteredFaqs.map((cat, i) => (
               <div key={i}>
                  <h3 className="font-bold text-slate-900 mb-3 ml-1">{cat.category}</h3>
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                     {cat.questions.map((faq, j) => {
                        const id = `${i}-${j}`;
                        const isOpen = openIndex === id;
                        return (
                           <div key={j} className="bg-white">
                              <button 
                                onClick={() => toggleOpen(id)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                              >
                                 <span className="font-medium text-sm text-slate-800">{faq.q}</span>
                                 {isOpen ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                              </button>
                              {isOpen && (
                                 <div className="p-4 pt-0 text-sm text-slate-500 leading-relaxed bg-slate-50/50 animate-in slide-in-from-top-1 fade-in duration-200">
                                    {faq.a}
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>
            ))}
         </div>

         {/* Still need help */}
         <div className="bg-indigo-600 rounded-3xl p-8 text-center text-white shadow-xl shadow-indigo-600/20">
            <h3 className="text-xl font-bold mb-2">Still need help?</h3>
            <p className="text-indigo-200 text-sm mb-6">Our support team is available 24/7 to assist with any issues.</p>
            <button 
              onClick={() => setShowSupportModal(true)}
              className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors inline-flex items-center gap-2"
            >
               <MessageCircle size={18} /> Contact Support
            </button>
         </div>
      </div>

      <SupportModal isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} userId={userId} />
    </div>
  );
};
