
import React, { useState, useEffect } from 'react';
import { Item, UserProfile, Review, Badge } from '../types';
import { api } from '../services/api';
import { ChevronLeft, Share2, Heart, MapPin, ShieldCheck, MessageCircle, ShoppingBag, Calendar, AlertTriangle, User, ChevronRight, Repeat, Flag, Star, HandHeart } from 'lucide-react';
import { BookingModal } from '../components/BookingModal';
import { PurchaseModal } from '../components/PurchaseModal';
import { SwapModal } from '../components/SwapModal';
import { FulfillModal } from '../components/FulfillModal';
import { SafetyMap } from '../components/SafetyMap';
import { ReviewModal } from '../components/ReviewModal';
import { getUserBadges } from '../services/badgeService';
import { useToast } from '../components/Toast';

interface ItemDetailViewProps {
  item: Item;
  currentUser: UserProfile;
  onBack: () => void;
  onChat?: (item: Item) => void;
  onBuy?: (item: Item) => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({ item, currentUser, onBack, onChat }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerBadges, setSellerBadges] = useState<Badge[]>([]);
  const { showToast } = useToast();
  
  const [showBooking, setShowBooking] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showFulfill, setShowFulfill] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const images = item.images && item.images.length > 0 ? item.images : [item.image];
  const isOwnItem = item.sellerId === currentUser.id;

  useEffect(() => {
    if (item.sellerId) {
       api.getReviews(item.sellerId).then(setReviews);
       api.getProfile(item.sellerId).then(profile => {
         if (profile) setSellerBadges(getUserBadges(profile));
       });
    }
    api.checkIsSaved(currentUser.id, item.id).then(setIsSaved);
  }, [item.id]);

  const handleMainAction = () => {
    if (isOwnItem) return;
    if (item.type === 'SERVICE') setShowBooking(true);
    else if (item.type === 'SALE') setShowPurchase(true);
    else if (item.type === 'SWAP') setShowSwap(true);
    else if (item.type === 'REQUEST') setShowFulfill(true);
    else if (onChat) onChat(item);
  };

  const handleToggleSave = async () => {
    try {
      const saved = await api.toggleSavedItem(currentUser.id, item.id);
      setIsSaved(saved);
      showToast(saved ? "Saved to Wishlist" : "Removed from Wishlist", 'info');
    } catch (e) { console.error(e); }
  };

  const handleReport = async () => {
    const reason = prompt("Please provide a reason for reporting this item:");
    if (reason) {
      try {
        await api.createReport({
          reporterId: currentUser.id,
          itemId: item.id,
          reason: reason
        });
        showToast("Report submitted successfully.", 'success');
      } catch (e) {
        showToast("Failed to submit report.", 'error');
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `Check out this ${item.title} on Seconds!`,
          url: window.location.href
        });
      } catch (e) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard!", 'success');
    }
  };

  // --- TRANSACTION HANDLERS ---

  const handlePurchase = async () => {
    try {
      await api.createTransaction({
        buyerId: currentUser.id,
        sellerId: item.sellerId,
        itemId: item.id,
        amount: item.price
      });
      showToast("Order placed successfully!", 'success');
      setShowPurchase(false);
    } catch (e) {
      console.error(e);
      showToast("Failed to place order.", 'error');
    }
  };

  const handleBooking = async (date: string, time: string) => {
    try {
      await api.createBooking({
        bookerId: currentUser.id,
        providerId: item.sellerId,
        serviceId: item.id,
        bookingDate: new Date(`${date}T${time}`).toISOString()
      });
      showToast("Booking request sent!", 'success');
      setShowBooking(false);
    } catch (e) {
      console.error(e);
      showToast("Failed to book service.", 'error');
    }
  };

  const handleSwap = async (offeredItemId: string) => {
    try {
      await api.createSwapProposal({
        initiatorId: currentUser.id,
        receiverId: item.sellerId,
        targetItemId: item.id,
        offeredItemId: offeredItemId
      });
      showToast("Swap proposal sent!", 'success');
      setShowSwap(false);
    } catch (e) {
      console.error(e);
      showToast("Failed to send proposal.", 'error');
    }
  };

  const handleFulfill = async (offeredItemId: string) => {
    try {
      await api.createSwapProposal({
        initiatorId: currentUser.id,
        receiverId: item.sellerId, 
        targetItemId: item.id,     
        offeredItemId: offeredItemId 
      });
      showToast("Offer sent to requester!", 'success');
      setShowFulfill(false);
    } catch (e) {
      console.error(e);
      showToast("Failed to send offer.", 'error');
    }
  };

  return (
    <div className="pb-32 md:pb-8 bg-white min-h-screen flex flex-col relative animate-fade-in">
      {/* Floating Back Button */}
      <div className="fixed top-4 left-4 z-40">
        <button onClick={onBack} className="glass p-3 rounded-full text-slate-800 shadow-lg hover:bg-white transition-all">
          <ChevronLeft size={24} />
        </button>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
          
          {/* Gallery */}
          <div className="relative aspect-square md:aspect-[4/3] bg-slate-100 md:rounded-3xl md:mt-4 md:ml-4 overflow-hidden group">
            <img 
              src={images[currentImageIndex]} 
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" 
            />
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 glass px-3 py-1.5 rounded-full">
                {images.map((_, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-slate-900 scale-125' : 'bg-slate-400'}`} />
                ))}
              </div>
            )}
            <div className="absolute top-4 right-4 glass px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-sm">
              {item.type}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 md:pt-8 space-y-8">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight w-full pr-4">{item.title}</h1>
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleShare} className="p-2 bg-slate-50 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors" title="Share">
                    <Share2 size={24} />
                  </button>
                  {!isOwnItem && (
                    <button onClick={handleReport} className="p-2 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Report Item">
                      <Flag size={24} />
                    </button>
                  )}
                  <button onClick={handleToggleSave} className="p-2 bg-slate-50 rounded-full hover:bg-pink-50 text-slate-400 hover:text-pink-500 transition-colors" title="Save to Wishlist">
                    <Heart size={24} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-pink-500" : ""} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <MapPin size={16} /> {item.college}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tight">${item.price}</span>
                {item.originalPrice && <span className="text-lg text-slate-400 line-through decoration-2">${item.originalPrice}</span>}
              </div>
            </div>

            <div className="flex gap-2">
               <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 uppercase tracking-wider">{item.category}</div>
               <div className="bg-green-50 px-4 py-2 rounded-xl text-xs font-bold text-green-700 uppercase tracking-wider">Good Condition</div>
            </div>

            {/* Seller Card */}
            <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                     <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <User size={24} />
                     </div>
                  </div>
                  <div>
                     <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                        {item.sellerName}
                        {item.verified && <ShieldCheck size={16} className="text-blue-500" />}
                     </h3>
                     <div className="flex items-center gap-1 text-xs font-bold text-amber-500 mt-1">
                        <Star size={12} fill="currentColor" /> {item.rating} <span className="text-slate-400 font-medium ml-1">({reviews.length} reviews)</span>
                     </div>
                  </div>
               </div>
               {!isOwnItem && (
                 <button onClick={() => onChat && onChat(item)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm hover:scale-105 transition-transform">
                    <MessageCircle size={20} />
                 </button>
               )}
            </div>

            <div className="space-y-3">
               <h3 className="font-bold text-slate-900 text-lg">Description</h3>
               <p className="text-slate-600 leading-relaxed">{item.description}</p>
            </div>

            <SafetyMap collegeName={item.college} />
          </div>
        </div>
      </div>

      {/* Glass Action Dock */}
      {!isOwnItem && (
        <div className="fixed bottom-6 left-6 right-6 z-40 md:static md:p-0 md:mt-8 md:max-w-md">
          <div className="glass p-2 rounded-[24px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] border border-white/50 flex gap-2">
             <button 
               onClick={() => onChat && onChat(item)}
               className="flex-1 py-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-1"
             >
               <MessageCircle size={20} />
               <span className="text-[10px] uppercase tracking-wider">Chat</span>
             </button>
             <button 
               onClick={handleMainAction}
               className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 text-lg hover:scale-[1.02] active:scale-95 transition-all"
             >
               {item.type === 'SALE' ? 'Buy Now' : item.type === 'RENT' ? 'Rent' : item.type === 'SERVICE' ? 'Book' : 'Action'}
             </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <BookingModal isOpen={showBooking} onClose={() => setShowBooking(false)} serviceTitle={item.title} price={item.price} onConfirm={handleBooking} />
      <PurchaseModal isOpen={showPurchase} onClose={() => setShowPurchase(false)} itemTitle={item.title} price={item.price} onConfirm={handlePurchase} />
      <SwapModal isOpen={showSwap} onClose={() => setShowSwap(false)} targetItemTitle={item.title} userId={currentUser.id} onConfirm={handleSwap} />
      <FulfillModal isOpen={showFulfill} onClose={() => setShowFulfill(false)} requestTitle={item.title} requesterName={item.sellerName} userId={currentUser.id} onRequestFulfill={handleFulfill} />
      <ReviewModal isOpen={showReview} onClose={() => setShowReview(false)} targetUserId={item.sellerId || ''} targetUserName={item.sellerName} currentUserId={currentUser.id} />
    </div>
  );
};
