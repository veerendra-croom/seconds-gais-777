import React, { useEffect, useState } from 'react';
import { Conversation, UserProfile } from '../types';
import { api } from '../services/api';
import { Search, MessageCircle, ChevronRight, Loader2 } from 'lucide-react';

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
    
    // Subscribe to new messages to update the list "live" (basic implementation)
    // In a full implementation, we'd update the specific conversation's lastMessage
    const subscription = api.subscribeToMessages(user.id, (newMsg) => {
       // Ideally, we just update the state here, but re-fetching is safer for data consistency in MVP
       loadConversations(); 
    });

    return () => {
      subscription.unsubscribe();
    };
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
    <div className="pb-24 md:pb-8 bg-white min-h-screen">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
        <div className="mt-2 relative">
           <input 
             type="text" 
             placeholder="Search messages..." 
             className="w-full bg-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
           />
           <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
        </div>
      </div>

      <div className="p-0 md:p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
             <Loader2 className="animate-spin text-primary-500 mb-2" />
             <p className="text-slate-400 text-sm">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
               <MessageCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No messages yet</h3>
            <p className="text-slate-500 text-sm mt-1">Start a conversation from the marketplace listings to negotiate prices or ask questions.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {conversations.map((conv) => (
              <button 
                key={conv.partnerId}
                onClick={() => onSelectChat(conv)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="relative shrink-0">
                  <img src={conv.partnerAvatar} alt={conv.partnerName} className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="font-bold text-slate-900 truncate">{conv.partnerName}</h3>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(conv.lastMessageTime).toLocaleDateString() === new Date().toLocaleDateString() 
                        ? new Date(conv.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                        : new Date(conv.lastMessageTime).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                    {conv.lastMessage}
                  </p>
                  
                  {conv.itemTitle && (
                    <div className="flex items-center gap-1 mt-1.5">
                       <div className="w-4 h-4 bg-slate-100 rounded overflow-hidden shrink-0">
                         {conv.itemImage && <img src={conv.itemImage} className="w-full h-full object-cover" />}
                       </div>
                       <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                         Re: {conv.itemTitle}
                       </span>
                    </div>
                  )}
                </div>
                
                <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};