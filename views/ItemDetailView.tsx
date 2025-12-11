import React, { useState, useEffect } from 'react';
import { Item, UserProfile, Review, Badge } from '../types';
import { api } from '../services/api';
import { analyzePrice, analyzeSustainability } from '../services/geminiService';
import { ChevronLeft, Share2, Heart, MapPin, ShieldCheck, MessageCircle, ShoppingBag, Calendar, AlertTriangle, User, ChevronRight, Repeat, Flag, Star, HandHeart, AlertCircle, TrendingUp, Sparkles, Clock, Leaf, Droplets } from 'lucide-react';
import { BookingModal } from '../components/BookingModal';
import { PurchaseModal } from '../components/PurchaseModal';
import { SwapModal } from '../components/SwapModal';
import { FulfillModal } from '../components/FulfillModal';
import { SafetyMap } from '../components/SafetyMap';
import { ReviewModal } from '../components/ReviewModal';
import { ReportModal } from '../components/ReportModal';
import { getUserBadges } from '../services/badgeService';
import { BadgeIcon } from '../components/BadgeIcon';
import { ItemCard } from '../components/ItemCard';
import { useToast } from '../components/Toast';

interface ItemDetailViewProps {
  item: Item;
  currentUser: UserProfile;
  onBack: () => void;
  onChat?: (item: Item) => void;
  onBuy?: (item: Item) => void;
  onViewProfile?: (userId: string) => void;
  onItemClick?: (item: Item) => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({ item, currentUser, onBack, onChat, onViewProfile, onItemClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerBadges, setSellerBadges] = useState<Badge[]>([]);
  const [similarItems, setSimilarItems] = useState<Item[]>([]);
  const { showToast } = useToast();
  
  // AI Insights State
  const [priceInsight, setPriceInsight] = useState<{ verdict: string, estimatedRange: string, reason: string } | null>(null);
  const [ecoImpact, setEcoImpact] = useState<{ co2Saved: string, waterSaved: string, fact: string } | null>(null);
  
  const [showBooking, setShowBooking] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showFulfill, setShowFulfill] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const images = item.images && item.images.length > 0 ? item.images : [item.image];
  const isOwnItem = item.sellerId === currentUser.id;
  const isSold = item.status === 'SOLD';
  const isDraft = item.status === 'DRAFT';

  useEffect(() => {
    // Reset state when item changes
    setCurrentImageIndex(0);
    setPriceInsight(null);
    setEcoImpact(null);
    window.scrollTo(0, 0);

    if (item.sellerId) {
       api.getReviews(item.sellerId).then(setReviews);
       api.getProfile(item.sellerId).then(profile => {
         if (profile) setSellerBadges(getUserBadges(profile));
       });
    }
    
    // Fetch Saved State
    api.checkIsSaved(currentUser.id, item.id).then(setIsSaved);

    // Fetch Similar Items
    api.getSimilarItems(item.category, item.id).then(setSimilarItems);

    // AI Analysis
    if (item.type === 'SALE') {
       if (item.price > 0) analyzePrice(item.title, item.price).then(setPriceInsight);
       analyzeSustainability(item.title, item.category).then(setEcoImpact);
    }

  }, [item.id, currentUser.id]);

  const handleMainAction = () => {
    if (isOwnItem || isSold || isDraft) return;
    if (item.type === 'SERVICE') setShowBooking(true);
    else if (item.type === 'SALE') setShowPurchase(true);
    else if (item.type === 'SWAP') setShowSwap(true);
    else if (item.type === 'REQUEST') setShowFulfill(true);
    else if (onChat) onChat(item);
  };

  const handleToggleSave = async () => {
    // Optimistic UI Update
    const newState = !isSaved;
    setIsSaved(newState);
    
    try {
      const saved = await api.toggleSavedItem(currentUser.id, item.id);
      // Ensure sync
      if (saved !== newState) setIsSaved(saved);
      showToast(saved ? "Saved to Wishlist" : "Removed from Wishlist", 'info');
    } catch (e) { 
      console.error(e);
      setIsSaved(!newState); // Revert
      showToast("Action failed", 'error');
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

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
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

  // Helper for Button Label
  const getActionLabel = () => {
    if (isSold) return 'Item Sold';
    switch (item.type) {
      case 'SALE': return 'Buy Now';
      case 'RENT': return 'Chat to Rent';
      case 'SHARE': return 'Chat to Borrow';
      case 'SWAP': return 'Propose Trade';
      case 'REQUEST': return 'Fulfill Request';
      case 'SERVICE': return 'Book Service';
      default: return 'Contact Seller';
    }
  };

  // Helper for Button Icon
  const getActionIcon = () => {
    switch (item.type) {
      case 'SALE': return <ShoppingBag size={20} />;
      case 'RENT': return <Clock size={20} />;
      case 'SHARE': return <Leaf size={20} />;
      case 'SWAP': return <Repeat size={20} />;
      case 'REQUEST': return <HandHeart size={20} />;
      case 'SERVICE': return <Calendar size={20} />;
      default: return <MessageCircle size={20} />;
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
          <div className="relative aspect-square md:aspect-[4/3] bg-slate-100 md:rounded-3xl md:mt-4 md:ml-4 overflow-hidden group select-none">
            <img 
              src={images[currentImageIndex]} 
              alt={item.title}
              className={`w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${isSold ? 'grayscale opacity-75' : ''}`} 
            />
            
            {isSold && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20">
                  <div className="bg-red-600 text-white font-black text-2xl px-6 py-2 rounded-xl shadow-xl transform -rotate-12 border-4 border-white tracking-widest uppercase">
                     SOLD
                  </div>
               </div>
            )}

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/30 backdrop-blur hover:bg-white/50 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 z-30"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/30 backdrop-blur hover:bg-white/50 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 z-30"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 glass px-3 py-1.5 rounded-full z-30">
                {images.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-slate-900 scale-125' : 'bg-slate-400 hover:bg-slate-500'}`} 
                  />
                ))}
              </div>
            )}
            <div className="absolute top-4 right-4 glass px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-sm z-30">
              {item.type}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 md:pt-8 space-y-8">
            {isDraft && (
               <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                  <AlertCircle size={20} />
                  <div>
                     <p className="font-bold">Draft Mode</p>
                     <p className="text-xs">This item is not visible to other students yet.</p>
                  </div>
               </div>
            )}

            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight w-full pr-4">{item.title}</h1>
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleShare} className="p-2 bg-slate-50 rounded-full hover:bg-blue-50 text-slate-400 hover:text-blue-500 transition-colors" title="Share">
                    <Share2 size={24} />
                  </button>
                  {!isOwnItem && (
                    <button onClick={() => setShowReport(true)} className="p-2 bg-slate-50 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Report Item">
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
                <span className="text-4xl font-black text-slate-900 tracking-tight">
                  {item.type === 'REQUEST' ? `Budget: $${item.price}` : `$${item.price}`}
                </span>
                {item.type === 'RENT' && <span className="text-sm font-bold text-slate-400">/ day</span>}
                {item.type === 'SERVICE' && <span className="text-sm font-bold text-slate-400">/ hour</span>}
                {item.originalPrice && item.type === 'SALE' && <span className="text-lg text-slate-400 line-through decoration-2">${item.originalPrice}</span>}
              </div>
            </div>

            {/* AI Insights & Eco-Impact */}
            <div className="grid grid-cols-1 gap-4">
               {priceInsight && !isOwnItem && item.type === 'SALE' && (
                 <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-start gap-4 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                       <Sparkles size={64} className="text-indigo-500" />
                    </div>
                    
                    <div className="bg-white p-2.5 rounded-xl shadow-sm text-indigo-600 shrink-0">
                       <TrendingUp size={24} />
                    </div>
                    <div className="flex-1 relative z-10">
                       <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-indigo-900 text-sm">Market Insight</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${priceInsight.verdict === 'Great Deal' ? 'bg-green-100 text-green-700' : priceInsight.verdict === 'Overpriced' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                             {priceInsight.verdict}
                          </span>
                       </div>
                       <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                          {priceInsight.reason} Typically sells for <span className="font-bold">{priceInsight.estimatedRange}</span>.
                       </p>
                    </div>
                 </div>
               )}

               {ecoImpact && (
                 <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100 flex flex-col animate-fade-in relative overflow-hidden">
                    <div className="flex items-start gap-4 z-10 relative">
                       <div className="bg-white p-2.5 rounded-xl shadow-sm text-emerald-600 shrink-0">
                          <Leaf size={24} />
                       </div>
                       <div className="flex-1">
                          <h4 className="font-bold text-emerald-900 text-sm mb-1">Environmental Impact</h4>
                          <p className="text-xs text-emerald-700 font-medium leading-relaxed mb-3">
                             {ecoImpact.fact}
                          </p>
                          <div className="flex gap-4">
                             <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                                <Leaf size={14} className="text-green-600" />
                                <span className="text-xs font-bold text-green-800">{ecoImpact.co2Saved} CO₂</span>
                             </div>
                             <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                                <Droplets size={14} className="text-blue-500" />
                                <span className="text-xs font-bold text-blue-800">{ecoImpact.waterSaved} Water</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="flex gap-2">
               <div className="bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 uppercase tracking-wider">{item.category}</div>
               {item.type === 'SHARE' && (
                 <div className="bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <Leaf size={12} /> Community Share
                 </div>
               )}
            </div>

            {/* Seller Card */}
            <div 
              onClick={() => item.sellerId && onViewProfile && onViewProfile(item.sellerId)}
              className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-3xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-slate-200 transition-all"
            >
               <div className="flex items-center justify-between mb-3">
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
                 {!isOwnItem && !isDraft && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); onChat && onChat(item); }} 
                     className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 shadow-sm hover:scale-105 transition-transform"
                   >
                      <MessageCircle size={20} />
                   </button>
                 )}
               </div>
               
               {/* Badges Row */}
               {sellerBadges.length > 0 && (
                 <div className="flex gap-2 pt-3 border-t border-slate-100">
                   {sellerBadges.map(badge => (
                     <BadgeIcon key={badge.id} badge={badge} size="sm" />
                   ))}
                 </div>
               )}
            </div>

            <div className="space-y-3">
               <h3 className="font-bold text-slate-900 text-lg">Description</h3>
               <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>

            <SafetyMap collegeName={item.college} />
            
            {/* Similar Items Section */}
            {similarItems.length > 0 && (
              <div className="pt-8 border-t border-slate-100">
                 <h3 className="font-bold text-slate-900 text-lg mb-4">You might also like</h3>
                 <div className="grid grid-cols-2 gap-4">
                    {similarItems.map(simItem => (
                       <ItemCard key={simItem.id} item={simItem} onClick={() => onItemClick && onItemClick(simItem)} />
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Glass Action Dock */}
      {!isOwnItem && !isDraft && (
        <div className="fixed bottom-6 left-6 right-6 z-40 md:static md:p-0 md:mt-8 md:max-w-md">
          <div className="glass p-2 rounded-[24px] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] border border-white/50 flex gap-2">
             <button 
               onClick={() => onChat && onChat(item)}
               disabled={isSold}
               className="flex-1 py-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:bg-slate-50"
             >
               <MessageCircle size={20} />
               <span className="text-[10px] uppercase tracking-wider">Chat</span>
             </button>
             <button 
               onClick={handleMainAction}
               disabled={isSold}
               className={`flex-[2] py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 text-lg transition-all ${
                 isSold 
                   ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                   : 'bg-slate-900 text-white hover:scale-[1.02] active:scale-95'
               }`}
             >
               {isSold ? 'Item Sold' : (
                 <>
                   {getActionIcon()}
                   {getActionLabel()}
                 </>
               )}
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
      <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} itemId={item.id} reporterId={currentUser.id} />
    </div>
  );
};