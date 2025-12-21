
import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, UserProfile, Item } from '../types';
import { api } from '../services/api';
import { generateSmartReplies, getSafeMeetingSpots } from '../services/geminiService';
import { ChevronLeft, Send, Image as ImageIcon, MoreVertical, ShieldCheck, MapPin, Phone, Ban, Loader2, Sparkles, X, Building2, CheckCircle2, XCircle, Calendar, ShoppingBag, HandHeart, Leaf } from 'lucide-react';
import { useToast } from '../components/Toast';

interface ChatViewProps {
  currentUser: UserProfile;
  activeConversation: Conversation | null; 
  targetItem?: Item; 
  onBack: () => void;
  onViewItem?: (itemId: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, activeConversation, targetItem, onBack, onViewItem }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const { showToast } = useToast();

  const partnerId = activeConversation?.partnerId || targetItem?.sellerId || '';
  const partnerName = activeConversation?.partnerName || targetItem?.sellerName || 'User';

  useEffect(() => {
    loadMessages();
    const channelId = [currentUser.id, partnerId].sort().join('-');
    
    const msgSub = api.subscribeToMessages(currentUser.id, (msg) => {
      if (msg.senderId === partnerId || msg.senderId === currentUser.id) {
        setMessages(prev => [...prev, msg]);
        if (msg.senderId === partnerId) updateReplies([...messages, msg]);
      }
    });

    const typingSub = api.subscribeToTyping(channelId, (status) => {
      setIsTyping(status);
    });

    return () => { msgSub.unsubscribe(); typingSub.unsubscribe(); };
  }, [partnerId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const loadMessages = async () => {
    try {
      const msgs = await api.getMessages(currentUser.id, partnerId, activeConversation?.itemId || targetItem?.id);
      setMessages(msgs);
      updateReplies(msgs);
    } finally { setLoading(false); }
  };

  const updateReplies = async (msgs: Message[]) => {
    setLoadingReplies(true);
    const recent = msgs.slice(-5).map(m => ({ sender: m.senderId === currentUser.id ? 'ME' as const : 'THEM' as const, content: m.content }));
    const replies = await generateSmartReplies(recent, targetItem?.title);
    setSmartReplies(replies);
    setLoadingReplies(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    const channelId = [currentUser.id, partnerId].sort().join('-');
    const typingSub = api.subscribeToTyping(channelId, () => {});
    typingSub.sendTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => typingSub.sendTyping(false), 2000);
  };

  const handleSend = async (e?: React.FormEvent, contentOverride?: string) => {
    e?.preventDefault();
    const text = contentOverride || newMessage;
    if (!text.trim()) return;
    setNewMessage('');
    try {
      await api.sendMessage(currentUser.id, partnerId, text, targetItem?.id || activeConversation?.itemId);
    } catch (e) { showToast("Message failed", 'error'); }
  };

  const handleSuggestSpot = async () => {
    setShowSafeZones(true);
    if (safeZones.length === 0) {
      const spots = await getSafeMeetingSpots(currentUser.college);
      setSafeZones(spots);
    }
  };

  const renderMessage = (msg: Message) => {
    const isMe = msg.senderId === currentUser.id;
    if (msg.content.startsWith('[MEETUP_PROPOSAL]:::')) {
      const spot = msg.content.split(':::')[1];
      return (
        <div className={`p-3 rounded-2xl border ${isMe ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-2"><MapPin size={14}/> <span className="text-[10px] font-black uppercase">Suggested Meetup</span></div>
          <p className="font-bold text-sm mb-2">{spot}</p>
          {!isMe && (
             <div className="flex gap-2">
                <button onClick={() => handleSend(undefined, `[MEETUP_CONFIRMED]:::${spot}`)} className="flex-1 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg">Accept</button>
                <button onClick={() => handleSend(undefined, '[MEETUP_DECLINED]')} className="flex-1 py-1 bg-white border border-slate-200 text-[10px] font-bold rounded-lg">Decline</button>
             </div>
          )}
        </div>
      );
    }
    return msg.content;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 max-w-4xl mx-auto border-x border-slate-100">
      <div className="p-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
         <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-50 rounded-full"><ChevronLeft size={24}/></button>
            <div className="flex items-center gap-2">
               <img src={`https://ui-avatars.com/api/?name=${partnerName}`} className="w-8 h-8 rounded-full" />
               <h2 className="font-bold text-slate-800">{partnerName}</h2>
            </div>
         </div>
         <button onClick={handleSuggestSpot} className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"><MapPin size={22}/></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
         {messages.map((msg) => (
           <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${msg.senderId === currentUser.id ? 'bg-primary-600 text-white' : 'bg-white text-slate-800 border border-slate-100'}`}>
                 {renderMessage(msg)}
              </div>
           </div>
         ))}
         {isTyping && <div className="text-[10px] font-bold text-slate-400 italic">Typing...</div>}
         <div ref={messagesEndRef} />
      </div>

      {showSafeZones && (
        <div className="p-4 bg-white border-t border-slate-100 animate-in slide-in-from-bottom-4">
           <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-black uppercase text-slate-400">Recommended Safe Zones</h3>
              <button onClick={() => setShowSafeZones(false)}><X size={16}/></button>
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {safeZones.map(spot => (
                <button key={spot.id} onClick={() => handleSend(undefined, `[MEETUP_PROPOSAL]:::${spot.name}`)} className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold hover:border-primary-500 transition-all">{spot.name}</button>
              ))}
           </div>
        </div>
      )}

      <div className="p-4 bg-white border-t border-slate-200 pb-safe">
         <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 h-8">
            {smartReplies.map((r, i) => (
               <button key={i} onClick={() => handleSend(undefined, r)} className="whitespace-nowrap px-3 py-1 bg-primary-50 text-primary-700 text-[10px] font-bold rounded-full border border-primary-100 animate-in fade-in zoom-in">{r}</button>
            ))}
         </div>
         <form onSubmit={handleSend} className="flex gap-2">
            <input value={newMessage} onChange={handleInputChange} placeholder="Type a message..." className="flex-1 p-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500 text-sm" />
            <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all"><Send size={20}/></button>
         </form>
      </div>
    </div>
  );
};
