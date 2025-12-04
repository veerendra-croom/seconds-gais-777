
import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, UserProfile, Item } from '../types';
import { api } from '../services/api';
import { ChevronLeft, Send, Image as ImageIcon, MoreVertical, ShieldCheck, MapPin, Phone, Ban } from 'lucide-react';
import { useToast } from '../components/Toast';

interface ChatViewProps {
  currentUser: UserProfile;
  activeConversation: Conversation | null; 
  targetItem?: Item; 
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, activeConversation, targetItem, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const partnerId = activeConversation?.partnerId || targetItem?.sellerId || '';
  const partnerName = activeConversation?.partnerName || targetItem?.sellerName || 'Chat';
  const contextItemId = activeConversation?.itemId || targetItem?.id;

  useEffect(() => {
    if (partnerId) {
      loadMessages();
      const subscription = api.subscribeToMessages(currentUser.id, (msg) => {
        if (msg.senderId === partnerId || msg.senderId === currentUser.id) {
           setMessages(prev => [...prev, msg]);
           scrollToBottom();
        }
      });
      return () => { subscription.unsubscribe(); };
    }
  }, [partnerId]);

  const loadMessages = async () => {
    try {
      const msgs = await api.getMessages(currentUser.id, partnerId, contextItemId);
      setMessages(msgs);
      scrollToBottom();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !partnerId) return;

    const tempContent = newMessage;
    setNewMessage(''); 

    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: partnerId,
      content: tempContent,
      createdAt: new Date().toISOString(),
      isRead: false,
      itemId: contextItemId
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      await api.sendMessage(currentUser.id, partnerId, tempContent, contextItemId);
    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  const handleBlockUser = async () => {
    if (confirm(`Are you sure you want to block ${partnerName}? You won't see their messages or items anymore.`)) {
      try {
        await api.blockUser(currentUser.id, partnerId);
        showToast(`Blocked ${partnerName}`, 'success');
        onBack();
      } catch (e) {
        showToast("Failed to block user", 'error');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F0F2F5] md:h-full relative overflow-hidden">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors active:scale-95">
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
             <div className="relative">
                <img 
                  src={activeConversation?.partnerAvatar || `https://ui-avatars.com/api/?name=${partnerName}`} 
                  alt={partnerName} 
                  className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" 
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
             </div>
             <div>
               <h2 className="font-bold text-slate-900 leading-tight text-sm">{partnerName}</h2>
               {contextItemId && (
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                   Negotiating
                 </p>
               )}
             </div>
          </div>
        </div>
        <div className="flex gap-1 relative">
           <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"><Phone size={20} /></button>
           <button 
             onClick={() => setShowOptions(!showOptions)}
             className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
           >
             <MoreVertical size={20} />
           </button>
           
           {showOptions && (
             <div className="absolute top-12 right-0 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 w-40 animate-in fade-in zoom-in-95 duration-200">
               <button 
                 onClick={handleBlockUser}
                 className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
               >
                 <Ban size={16} /> Block User
               </button>
             </div>
           )}
        </div>
      </div>

      {/* Item Context Banner */}
      {(targetItem || (activeConversation?.itemTitle)) && (
        <div className="bg-white/60 backdrop-blur-md border-b border-slate-200/50 p-3 mx-4 mt-3 rounded-2xl flex items-center gap-3 shrink-0 shadow-sm z-20">
           <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
              <img 
                src={targetItem?.image || activeConversation?.itemImage || 'https://via.placeholder.com/50'} 
                className="w-full h-full object-cover" 
              />
           </div>
           <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 text-sm truncate">{targetItem?.title || activeConversation?.itemTitle}</h4>
              <p className="text-xs font-bold text-primary-600">{targetItem ? `$${targetItem.price}` : 'Listing'}</p>
           </div>
           <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
             View Item
           </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10">
        {loading ? (
           <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">Decripting chat...</div>
        ) : messages.length === 0 ? (
           <div className="text-center py-12">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                 <ShieldCheck size={32} className="text-blue-500" />
              </div>
              <p className="text-slate-500 text-sm px-8 max-w-xs mx-auto leading-relaxed">
                This is the start of your conversation with <strong className="text-slate-900">{partnerName}</strong>.<br/>
                Keep dealings inside the app for protection.
              </p>
           </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            const showTime = idx === 0 || (new Date(msg.createdAt).getTime() - new Date(messages[idx-1].createdAt).getTime() > 1000 * 60 * 15);

            return (
              <React.Fragment key={msg.id}>
                {showTime && (
                  <div className="flex justify-center">
                     <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 px-2 py-1 rounded-full">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in zoom-in-95 duration-200`}>
                   <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm shadow-sm relative ${
                     isMe 
                       ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-tr-sm shadow-primary-500/20' 
                       : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-slate-200/50'
                   }`}>
                     {msg.content}
                   </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-3 md:p-4 shrink-0 pb-safe z-30">
         <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
            <button type="button" className="p-3 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-2xl transition-colors">
              <ImageIcon size={22} />
            </button>
            <div className="flex-1 bg-slate-100 rounded-2xl flex items-center border border-transparent focus-within:border-primary-200 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
               <input 
                 type="text" 
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 placeholder="Type a message..."
                 className="w-full bg-transparent border-none focus:ring-0 px-4 py-3.5 text-sm md:text-base max-h-32 placeholder:text-slate-400 font-medium"
               />
            </div>
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-slate-800 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all"
            >
              <Send size={20} fill="currentColor" />
            </button>
         </form>
      </div>
    </div>
  );
};
