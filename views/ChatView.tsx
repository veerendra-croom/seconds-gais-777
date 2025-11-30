import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, UserProfile, Item } from '../types';
import { api } from '../services/api';
import { ChevronLeft, Send, Image as ImageIcon, MoreVertical, ShieldCheck, MapPin } from 'lucide-react';

interface ChatViewProps {
  currentUser: UserProfile;
  activeConversation: Conversation | null; // For list-based entry
  targetItem?: Item; // For direct entry from Item Detail
  onBack: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser, activeConversation, targetItem, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine partner details depending on how we entered the view
  const partnerId = activeConversation?.partnerId || targetItem?.sellerId || '';
  const partnerName = activeConversation?.partnerName || targetItem?.sellerName || 'Chat';
  const contextItemId = activeConversation?.itemId || targetItem?.id;

  useEffect(() => {
    if (partnerId) {
      loadMessages();
      
      const subscription = api.subscribeToMessages(currentUser.id, (msg) => {
        // Only append if it belongs to this conversation
        if (msg.senderId === partnerId || msg.senderId === currentUser.id) {
           setMessages(prev => [...prev, msg]);
           scrollToBottom();
        }
      });
      
      return () => {
        subscription.unsubscribe();
      };
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
    setNewMessage(''); // Clear input immediately (Optimistic UI)

    // Optimistic Update
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
      // In a strict app, replace optimistic msg with real one, but since we subscribe to own inserts via realtime (if set up) or just assume success, this is fine for MVP.
      // Ideally, update the ID of the optimistic message once returned.
    } catch (err) {
      console.error("Failed to send", err);
      // Rollback on error in a real app
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 md:h-full relative z-30">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex items-center gap-3">
             <div className="relative">
                <img 
                  src={activeConversation?.partnerAvatar || `https://ui-avatars.com/api/?name=${partnerName}`} 
                  alt={partnerName} 
                  className="w-10 h-10 rounded-full object-cover border border-slate-100" 
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
             </div>
             <div>
               <h2 className="font-bold text-slate-900 leading-tight">{partnerName}</h2>
               {contextItemId && (
                 <p className="text-xs text-slate-500 flex items-center gap-1">
                   Looking at {activeConversation?.itemTitle || targetItem?.title || 'an item'}
                 </p>
               )}
             </div>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600">
           <MoreVertical size={20} />
        </button>
      </div>

      {/* Item Context Banner (if negotiating specifically) */}
      {(targetItem || (activeConversation?.itemTitle)) && (
        <div className="bg-slate-100 border-b border-slate-200 p-3 flex items-center gap-3 shrink-0">
           <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 border border-slate-200">
              <img 
                src={targetItem?.image || activeConversation?.itemImage || 'https://via.placeholder.com/50'} 
                className="w-full h-full object-cover" 
              />
           </div>
           <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 text-sm truncate">{targetItem?.title || activeConversation?.itemTitle}</h4>
              <p className="text-xs text-slate-500 font-bold">{targetItem ? `$${targetItem.price}` : 'Item Discussion'}</p>
           </div>
           <div className="flex gap-2">
             <button className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm">
               Make Offer
             </button>
           </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
           <div className="text-center py-10 text-slate-400 text-sm">Loading history...</div>
        ) : messages.length === 0 ? (
           <div className="text-center py-10">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                 <ShieldCheck size={32} />
              </div>
              <p className="text-slate-500 text-sm px-8">
                This is the start of your conversation with <strong>{partnerName}</strong>. 
                Keep conversations inside Seconds-App for your safety.
              </p>
           </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            const showTime = idx === 0 || (new Date(msg.createdAt).getTime() - new Date(messages[idx-1].createdAt).getTime() > 1000 * 60 * 15);

            return (
              <React.Fragment key={msg.id}>
                {showTime && (
                  <div className="text-center text-[10px] text-slate-400 my-4 uppercase tracking-wider font-medium">
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                     isMe 
                       ? 'bg-primary-600 text-white rounded-tr-none' 
                       : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
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
      <div className="bg-white border-t border-slate-200 p-3 md:p-4 shrink-0 pb-safe">
         <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
            <button type="button" className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors">
              <ImageIcon size={24} />
            </button>
            <div className="flex-1 bg-slate-100 rounded-2xl flex items-center">
               <input 
                 type="text" 
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 placeholder="Type a message..."
                 className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-sm md:text-base max-h-32"
               />
            </div>
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="p-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
              <Send size={20} />
            </button>
         </form>
      </div>
    </div>
  );
};