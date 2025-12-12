
import React, { useEffect, useState } from 'react';
import { Conversation, UserProfile } from '../types';
import { api } from '../services/api';
import { Search, MessageCircle, ChevronRight, Loader2, ChevronLeft } from 'lucide-react';

interface ChatListViewProps {
  user: UserProfile;
  onSelectChat: (conversation: Conversation) => void;
  onBack: () => void;
}

export const ChatListView: React.FC<ChatListViewProps> = ({ user, onSelectChat, onBack }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    const subscription = api.subscribeToMessages(user.id, (newMsg) => {
       loadConversations(); 
    });
    return () => { subscription.unsubscribe(); };
  }, [user.id]);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations(user.id);
      setConversations(data);
    } catch (e) {
      console.error("Failed to load chats", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Messages</h1>
        </div>
        <div className="relative group">
           <div className="absolute inset-0 bg-primary-100 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
           <input 
             type="text" 
             placeholder="Search chats..." 
             className="relative w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all placeholder:text-slate-400"
           />
           <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <Loader2 className="animate-spin text-primary-500 mb-2" />
             <p className="text-slate-400 text-sm font-medium">Syncing conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 text-slate-300 shadow-sm border border-slate-100">
               <MessageCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No messages yet</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">Your conversations with buyers and sellers will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv, idx) => (
              <button 
                key={conv.partnerId}
                onClick={() => onSelectChat(conv)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary-100 transition-all text-left group animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative shrink-0">
                  <img src={conv.partnerAvatar} alt={conv.partnerName} className="w-14 h-14 rounded-2xl object-cover bg-slate-100" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                      {conv.partnerName}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wide">
                      {new Date(conv.lastMessageTime).toLocaleDateString() === new Date().toLocaleDateString() 
                        ? new Date(conv.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : new Date(conv.lastMessageTime).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className={`text-sm truncate leading-relaxed ${conv.unreadCount > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                    {conv.lastMessage}
                  </p>
                  
                  {conv.itemTitle && (
                    <div className="inline-flex items-center gap-1.5 mt-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                       <div className="w-4 h-4 bg-slate-200 rounded overflow-hidden shrink-0">
                         {conv.itemImage && <img src={conv.itemImage} className="w-full h-full object-cover" />}
                       </div>
                       <span className="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">
                         {conv.itemTitle}
                       </span>
                    </div>
                  )}
                </div>
                
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors">
                   <ChevronRight size={16} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
