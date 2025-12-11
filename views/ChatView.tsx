
import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, UserProfile, Item } from '../types';
import { api } from '../services/api';
import { generateSmartReplies, getSafeMeetingSpots } from '../services/geminiService';
import { ChevronLeft, Send, Image as ImageIcon, MoreVertical, ShieldCheck, MapPin, Phone, Ban, Loader2, Sparkles, X, Building2, CheckCircle2, XCircle, Calendar, ShoppingBag, HandHeart, Leaf } from 'lucide-react';
import { useToast } from '../components/Toast';
import { PurchaseModal } from '../components/PurchaseModal';
import { BookingModal } from '../components/BookingModal';
import { FulfillModal } from '../components/FulfillModal';

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
  const [showOptions, setShowOptions] = useState(false);
  const [showMeetupModal, setShowMeetupModal] = useState(false);
  
  // Ensure we have the item details even if entered via Chat List
  const [fetchedItem, setFetchedItem] = useState<Item | null>(null);
  
  // Transaction Modals
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showFulfillModal, setShowFulfillModal] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>(["Hi, is this available?", "I'm interested!", "Can we meet nearby?"]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  
  // Safe Zone State
  const [safeZones, setSafeZones] = useState<{id: number, name: string, type: string}[]>([]);
  const [loadingSafeZones, setLoadingSafeZones] = useState(false);
  
  // Image Preview State
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  // Typing State
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const [typingSender, setTypingSender] = useState<any>(null); // To handle channel ref

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const partnerId = activeConversation?.partnerId || targetItem?.sellerId || '';
  const partnerName = activeConversation?.partnerName || targetItem?.sellerName || 'Chat';
  const contextItemId = activeConversation?.itemId || targetItem?.id;
  
  // Use fetched item if targetItem is missing (e.g. entering from list view)
  const activeItem = targetItem || fetchedItem;
  const contextItemTitle = activeConversation?.itemTitle || activeItem?.title || '';
  const contextItemImage = activeConversation?.itemImage || activeItem?.image;
  
  const isSeller = activeItem?.sellerId === currentUser.id;

  // Fetch Item Details if missing
  useEffect(() => {
    if (!targetItem && contextItemId && !fetchedItem) {
       api.getItem(contextItemId).then(item => {
         if(item) setFetchedItem(item);
       });
    }
  }, [contextItemId, targetItem]);

  useEffect(() => {
    if (partnerId) {
      loadMessages();
      // Mark as read immediately when opening
      api.markMessagesAsRead(partnerId, currentUser.id);
      
      const subscription = api.subscribeToMessages(currentUser.id, (msg) => {
        if (msg.senderId === partnerId || msg.senderId === currentUser.id) {
           setMessages(prev => {
             const updated = [...prev, msg];
             if (msg.senderId === partnerId) updateSmartReplies(updated);
             return updated;
           });
           scrollToBottom();
           if (msg.senderId === partnerId) {
             api.markMessagesAsRead(partnerId, currentUser.id);
           }
        }
      });

      // Typing Indicator Subscription
      // We create a unique channel ID based on sorted user IDs to ensure 1:1 chat uniqueness
      const channelId = [currentUser.id, partnerId].sort().join('-');
      const typingSub = api.subscribeToTyping(channelId, (status) => {
         setIsTyping(status);
         if (status) scrollToBottom();
      });
      setTypingSender(typingSub);

      return () => { 
        subscription.unsubscribe(); 
        typingSub.unsubscribe();
      };
    }
  }, [partnerId]);

  useEffect(() => {
    if (showMeetupModal && safeZones.length === 0) {
       loadSafeZones();
    }
  }, [showMeetupModal]);

  const loadMessages = async () => {
    try {
      const msgs = await api.getMessages(currentUser.id, partnerId, contextItemId);
      setMessages(msgs);
      updateSmartReplies(msgs);
      scrollToBottom();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadSafeZones = async () => {
    setLoadingSafeZones(true);
    try {
      const spots = await getSafeMeetingSpots(currentUser.college);
      setSafeZones(spots);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSafeZones(false);
    }
  };

  const updateSmartReplies = async (currentMessages: Message[]) => {
    const recent = currentMessages.slice(-5).map(m => ({
      sender: m.senderId === currentUser.id ? 'ME' as const : 'THEM' as const,
      content: m.content
    }));

    if (recent.length === 0 && contextItemTitle) {
       setSmartReplies([
         `Is the ${contextItemTitle} still available?`,
         `Can I buy the ${contextItemTitle}?`,
         "What condition is it in?"
       ]);
       return;
    }

    setLoadingReplies(true);
    try {
      const replies = await generateSmartReplies(recent, contextItemTitle);
      setSmartReplies(replies);
    } catch (e) {
      // Fallback
    } finally {
      setLoadingReplies(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPendingFile(file);
      setPendingPreview(URL.createObjectURL(file));
      e.target.value = '';
    }
  };

  const handleRemovePreview = () => {
    setPendingFile(null);
    setPendingPreview(null);
  };

  // Handle Input Change & Typing Events
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     setNewMessage(e.target.value);
     
     if (typingSender) {
        typingSender.sendTyping(true);
        
        // Clear previous timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        // Set new timeout to stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
           typingSender.sendTyping(false);
        }, 2000);
     }
  };

  const sendMessage = async (content: string, imageUrl: string = '') => {
    try {
      const optimisticMsg: Message = {
        id: `temp-${Date.now()}`,
        senderId: currentUser.id,
        receiverId: partnerId,
        content: content,
        image: imageUrl,
        createdAt: new Date().toISOString(),
        isRead: false,
        itemId: contextItemId
      };
      
      const newMessages = [...messages, optimisticMsg];
      setMessages(newMessages);
      scrollToBottom();
      setSmartReplies([]);
      if (typingSender) typingSender.sendTyping(false);

      await api.sendMessage(currentUser.id, partnerId, content, contextItemId, imageUrl);
      updateSmartReplies(newMessages);

    } catch (err) {
      console.error("Failed to send", err);
      showToast("Failed to send message", 'error');
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !pendingFile) || !partnerId) return;

    setUploading(true);
    let imageUrl = '';

    try {
      if (pendingFile) {
        const url = await api.uploadImage(pendingFile);
        if (url) imageUrl = url;
        else {
          showToast("Failed to upload image", 'error');
          setUploading(false);
          return;
        }
      }

      const content = newMessage;
      setNewMessage('');
      handleRemovePreview();

      await sendMessage(content, imageUrl);

    } finally {
      setUploading(false);
    }
  };

  const handleQuickReply = (text: string) => {
    setNewMessage(text);
  };

  const handleSuggestMeetup = (locationName: string) => {
    setShowMeetupModal(false);
    const content = `[MEETUP_PROPOSAL]:::${locationName}`;
    sendMessage(content);
  };

  const handleRespondToMeetup = (location: string, accepted: boolean) => {
    if (accepted) {
      sendMessage(`[MEETUP_CONFIRMED]:::${location}`);
    } else {
      sendMessage(`[MEETUP_DECLINED]`);
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

  // --- Transaction Handlers ---
  const handleConfirmPurchase = async () => {
    if (!activeItem) return;
    try {
      await api.createTransaction({
        buyerId: currentUser.id,
        sellerId: partnerId,
        itemId: activeItem.id,
        amount: activeItem.price
      });
      sendMessage(`[SYSTEM] Order placed for ${activeItem.title}.`);
      setShowPurchaseModal(false);
      showToast("Order Placed!", 'success');
    } catch (e) {
      showToast("Failed to create order", 'error');
    }
  };

  const handleConfirmBooking = async (date: string, time: string) => {
    if (!activeItem) return;
    try {
      await api.createBooking({
        bookerId: currentUser.id,
        providerId: partnerId,
        serviceId: activeItem.id,
        bookingDate: new Date(`${date}T${time}`).toISOString()
      });
      sendMessage(`[SYSTEM] Booking requested for ${date} at ${time}.`);
      setShowBookingModal(false);
      showToast("Booking Requested!", 'success');
    } catch (e) {
      showToast("Failed to book", 'error');
    }
  };

  const handleFulfillRequest = async (offeredItemId: string) => {
    if (!activeItem) return;
    try {
      await api.createSwapProposal({
        initiatorId: currentUser.id,
        receiverId: partnerId,
        targetItemId: activeItem.id,
        offeredItemId: offeredItemId
      });
      sendMessage(`[SYSTEM] Offer sent to fulfill request.`);
      setShowFulfillModal(false);
      showToast("Offer Sent!", 'success');
    } catch (e) {
      showToast("Failed to send offer", 'error');
    }
  };

  const handlePrimaryAction = () => {
    if (!activeItem || isSeller) {
       if (contextItemId && onViewItem) onViewItem(contextItemId);
       return;
    }

    if (activeItem.type === 'SALE' || activeItem.type === 'RENT') setShowPurchaseModal(true);
    else if (activeItem.type === 'SERVICE') setShowBookingModal(true);
    else if (activeItem.type === 'SHARE') sendMessage("Hi, I would like to borrow this item. When are you available?");
    else if (activeItem.type === 'SWAP') sendMessage("Hi, I'm interested in trading. Check out my profile?");
    else if (activeItem.type === 'REQUEST') setShowFulfillModal(true);
  };

  const getActionButtonLabel = () => {
    if (isSeller) return 'Manage Listing';
    if (!activeItem) return 'View Item';
    switch (activeItem.type) {
      case 'SALE': return 'Buy Now';
      case 'RENT': return 'Rent Now';
      case 'SERVICE': return 'Book Now';
      case 'SHARE': return 'Request Item';
      case 'SWAP': return 'Propose Swap';
      case 'REQUEST': return 'Fulfill Request';
      default: return 'View Item';
    }
  };

  const getActionColor = () => {
    if (!activeItem || isSeller) return 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800';
    switch (activeItem.type) {
      case 'REQUEST': return 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700';
      case 'SHARE': return 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700';
      default: return 'bg-slate-900 shadow-slate-900/20 hover:bg-slate-800';
    }
  };

  const getActionIcon = () => {
    if (!activeItem) return null;
    switch (activeItem.type) {
      case 'REQUEST': return <HandHeart size={16} />;
      case 'SHARE': return <Leaf size={16} />;
      case 'SALE': return <ShoppingBag size={16} />;
      case 'SERVICE': return <Calendar size={16} />;
      default: return null;
    }
  };

  const renderMessageContent = (msg: Message, isMe: boolean) => {
    // Check for special Meetup Format
    if (msg.content.startsWith('[MEETUP_PROPOSAL]:::')) {
      const location = msg.content.split(':::')[1];
      return (
        <div className={`p-1 ${isMe ? 'text-white' : 'text-slate-800'}`}>
           <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className={isMe ? 'text-blue-100' : 'text-blue-500'} />
              <span className="font-bold text-xs uppercase tracking-wide opacity-80">Meetup Proposal</span>
           </div>
           <div className={`bg-white/10 p-3 rounded-xl border ${isMe ? 'border-white/20' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                    <Building2 size={20} />
                 </div>
                 <div>
                    <p className={`font-bold text-sm ${isMe ? 'text-white' : 'text-slate-900'}`}>{location}</p>
                    <p className={`text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>Verified Safe Zone</p>
                 </div>
              </div>
           </div>
           
           {!isMe && (
             <div className="flex gap-2 mt-3">
                <button 
                  onClick={() => handleRespondToMeetup(location, true)}
                  className="flex-1 bg-slate-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleRespondToMeetup(location, false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Decline
                </button>
             </div>
           )}
           {isMe && <p className="text-[10px] mt-2 opacity-70 text-center">Waiting for response...</p>}
        </div>
      );
    }

    if (msg.content.startsWith('[MEETUP_CONFIRMED]:::')) {
      const location = msg.content.split(':::')[1];
      return (
        <div className={`p-1 ${isMe ? 'text-white' : 'text-slate-800'}`}>
           <div className="flex items-center gap-2 mb-2 text-green-500">
              <CheckCircle2 size={16} className={isMe ? 'text-white' : 'text-green-500'} />
              <span className={`font-bold text-xs uppercase tracking-wide opacity-90 ${isMe ? 'text-white' : 'text-green-600'}`}>Confirmed</span>
           </div>
           <div className={`p-3 rounded-xl border ${isMe ? 'bg-white/20 border-white/30' : 'bg-green-50 border-green-100'}`}>
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isMe ? 'bg-white text-green-600' : 'bg-green-100 text-green-600'}`}>
                    <Calendar size={20} />
                 </div>
                 <div>
                    <p className={`font-bold text-sm ${isMe ? 'text-white' : 'text-slate-900'}`}>Meeting at {location}</p>
                    <p className={`text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-500'}`}>See you there!</p>
                 </div>
              </div>
           </div>
        </div>
      );
    }

    if (msg.content.startsWith('[SYSTEM]')) {
       return (
         <div className={`p-1 italic text-xs ${isMe ? 'text-white/80' : 'text-slate-500'}`}>
            {msg.content.replace('[SYSTEM]', '')}
         </div>
       );
    }

    if (msg.content === '[MEETUP_DECLINED]') {
      return (
        <div className={`p-1 ${isMe ? 'text-white' : 'text-slate-800'}`}>
           <div className="flex items-center gap-2 mb-2 opacity-70">
              <XCircle size={16} />
              <span className="font-bold text-xs uppercase tracking-wide">Declined</span>
           </div>
           <p className="text-sm italic opacity-80">Meetup proposal was declined.</p>
        </div>
      );
    }

    return (
      <>
        {msg.image && (
          <div className="mb-2 -mx-2 -mt-2 rounded-t-xl overflow-hidden">
            <img 
              src={msg.image} 
              alt="Attachment" 
              className="w-full h-auto max-h-60 object-cover" 
              onLoad={scrollToBottom}
            />
          </div>
        )}
        {msg.content}
      </>
    );
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
      {(activeItem || contextItemTitle) && (
        <div className="bg-white/60 backdrop-blur-md border-b border-slate-200/50 p-3 mx-4 mt-3 rounded-2xl flex items-center gap-3 shrink-0 shadow-sm z-20">
           <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
              <img 
                src={activeItem?.image || contextItemImage || 'https://via.placeholder.com/50'} 
                className="w-full h-full object-cover" 
              />
           </div>
           <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 text-sm truncate">{activeItem?.title || contextItemTitle}</h4>
              <p className="text-xs font-bold text-primary-600">{activeItem ? `$${activeItem.price}` : 'Listing'}</p>
           </div>
           
           <button 
             onClick={handlePrimaryAction}
             className={`px-4 py-2 ${getActionColor()} text-white text-xs font-bold rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1`}
           >
             {getActionIcon()} {getActionButtonLabel()}
           </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10">
        {loading ? (
           <div className="space-y-4 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                   <div className={`h-12 w-2/3 rounded-2xl ${i % 2 === 0 ? 'bg-primary-100' : 'bg-white'} animate-pulse`}></div>
                </div>
              ))}
           </div>
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
                   <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm shadow-sm relative overflow-hidden ${
                     isMe 
                       ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-tr-sm shadow-primary-500/20' 
                       : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-slate-200/50'
                   }`}>
                     {renderMessageContent(msg, isMe)}
                   </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {isTyping && (
           <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center">
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Meetup Modal */}
      {showMeetupModal && (
        <div className="absolute bottom-20 left-4 right-4 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 animate-in slide-in-from-bottom-10 fade-in">
           <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <MapPin size={18} className="text-green-500" /> Suggest Safe Spot
              </h3>
              <button onClick={() => setShowMeetupModal(false)} className="p-1 hover:bg-slate-200 rounded-full">
                 <X size={18} className="text-slate-400" />
              </button>
           </div>
           
           <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
              {loadingSafeZones ? (
                 <div className="p-6 text-center text-slate-400 flex flex-col items-center">
                    <Loader2 size={24} className="animate-spin mb-2 text-primary-500" />
                    <span className="text-xs">AI finding safe zones at {currentUser.college}...</span>
                 </div>
              ) : safeZones.length > 0 ? (
                 <>
                   <p className="px-4 py-2 text-[10px] font-bold text-primary-600 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={10} /> AI Recommendations
                   </p>
                   {safeZones.map(zone => (
                     <button 
                       key={zone.id}
                       onClick={() => handleSuggestMeetup(zone.name)}
                       className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between group"
                     >
                        <div>
                           <p className="font-bold text-slate-700 text-sm group-hover:text-primary-600">{zone.name}</p>
                           <p className="text-[10px] text-slate-400 font-medium">{zone.type}</p>
                        </div>
                        <ChevronLeft size={16} className="rotate-180 text-slate-300 group-hover:text-primary-500" />
                     </button>
                   ))}
                 </>
              ) : (
                 <div className="p-4 text-center text-slate-400 text-sm">
                    No locations found.
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-3 md:p-4 shrink-0 pb-safe z-30 space-y-3">
         
         {/* Attachment Preview */}
         {pendingPreview && (
           <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm group mx-2 animate-in zoom-in duration-200">
              <img src={pendingPreview} className="w-full h-full object-cover" />
              <button 
                onClick={handleRemovePreview}
                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
              >
                <X size={12} />
              </button>
           </div>
         )}

         {/* Smart AI Replies */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 min-h-[32px]">
            {loadingReplies ? (
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full text-xs font-medium text-slate-400 animate-pulse border border-slate-100">
                  <Sparkles size={10} /> Thinking...
               </div>
            ) : smartReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(reply)}
                className="whitespace-nowrap px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-full text-xs font-bold text-indigo-600 transition-colors border border-indigo-100 flex items-center gap-1 animate-in slide-in-from-bottom-2 fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <Sparkles size={10} className="text-indigo-400" />
                {reply}
              </button>
            ))}
         </div>

         <form onSubmit={(e) => handleSend(e)} className="flex items-end gap-2 max-w-4xl mx-auto">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-2xl transition-colors disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? <Loader2 size={22} className="animate-spin" /> : <ImageIcon size={22} />}
            </button>
            
            <button 
              type="button" 
              onClick={() => setShowMeetupModal(!showMeetupModal)}
              className={`p-3 rounded-2xl transition-colors ${showMeetupModal ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
              disabled={uploading}
              title="Suggest Meetup"
            >
              <MapPin size={22} />
            </button>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            
            <div className="flex-1 bg-slate-100 rounded-2xl flex items-center border border-transparent focus-within:border-primary-200 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
               <input 
                 type="text" 
                 value={newMessage}
                 onChange={handleInputChange}
                 placeholder={uploading ? "Sending..." : "Type a message..."}
                 disabled={uploading}
                 className="w-full bg-transparent border-none focus:ring-0 px-4 py-3.5 text-sm md:text-base max-h-32 placeholder:text-slate-400 font-medium"
               />
            </div>
            <button 
              type="submit" 
              disabled={(!newMessage.trim() && !pendingFile) || uploading}
              className="p-3.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none transition-all"
            >
              <Send size={20} fill="currentColor" />
            </button>
         </form>
      </div>

      {/* Transaction Modals */}
      {activeItem && (
        <>
          <PurchaseModal 
            isOpen={showPurchaseModal} 
            onClose={() => setShowPurchaseModal(false)} 
            itemTitle={activeItem.title}
            price={activeItem.price}
            onConfirm={handleConfirmPurchase}
          />
          <BookingModal
            isOpen={showBookingModal}
            onClose={() => setShowBookingModal(false)}
            serviceTitle={activeItem.title}
            price={activeItem.price}
            onConfirm={handleConfirmBooking}
          />
          <FulfillModal 
            isOpen={showFulfillModal}
            onClose={() => setShowFulfillModal(false)}
            requestTitle={activeItem.title}
            requesterName={partnerName}
            userId={currentUser.id}
            onRequestFulfill={handleFulfillRequest}
          />
        </>
      )}
    </div>
  );
};
