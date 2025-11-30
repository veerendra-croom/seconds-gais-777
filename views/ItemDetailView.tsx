import React, { useState } from 'react';
import { Item, UserProfile } from '../types';
import { ChevronLeft, Share2, Heart, MapPin, ShieldCheck, MessageCircle, ShoppingBag, Calendar, AlertTriangle, User, ChevronRight } from 'lucide-react';

interface ItemDetailViewProps {
  item: Item;
  currentUser: UserProfile;
  onBack: () => void;
  onChat?: (item: Item) => void;
  onBuy?: (item: Item) => void;
}

export const ItemDetailView: React.FC<ItemDetailViewProps> = ({ item, currentUser, onBack, onChat, onBuy }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(false);

  const images = item.images && item.images.length > 0 ? item.images : [item.image];
  const isOwnItem = item.sellerId === currentUser.id;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleAction = () => {
    if (isOwnItem) return;
    if (item.type === 'SALE' && onBuy) {
      onBuy(item);
    } else if (onChat) {
      onChat(item);
    }
  };

  const getActionLabel = () => {
    if (isOwnItem) return 'This is your listing';
    switch (item.type) {
      case 'SALE': return 'Buy Now';
      case 'RENT': return 'Check Availability';
      case 'SWAP': return 'Propose Swap';
      case 'SERVICE': return 'Book Service';
      default: return 'Contact Seller';
    }
  };

  return (
    <div className="pb-24 md:pb-8 bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Share2 size={20} />
            </button>
            <button 
              onClick={() => setLiked(!liked)}
              className={`p-2 rounded-full transition-colors ${liked ? 'text-red-500 bg-red-50' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Heart size={20} fill={liked ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full">
        {/* Image Gallery */}
        <div className="relative aspect-square md:aspect-[16/9] bg-slate-100 md:rounded-b-2xl overflow-hidden group">
          <img 
            src={images[currentImageIndex]} 
            alt={`${item.title} view ${currentImageIndex + 1}`}
            className="w-full h-full object-cover" 
          />
          
          {images.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={24} />
              </button>
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider">
              {item.type}
            </span>
          </div>
        </div>

        <div className="p-4 md:p-8 space-y-8">
          {/* Main Info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-2">{item.title}</h1>
                <div className="flex items-center text-slate-500 text-sm">
                  <MapPin size={16} className="mr-1" />
                  {item.college}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl md:text-3xl font-bold text-primary-600">
                  {item.type === 'SWAP' ? 'SWAP' : `$${item.price}`}
                </p>
                {item.originalPrice && item.type === 'SALE' && (
                  <p className="text-sm text-slate-400 line-through">${item.originalPrice}</p>
                )}
                {item.type === 'RENT' && <p className="text-xs text-slate-500">per day</p>}
                {item.type === 'SERVICE' && <p className="text-xs text-slate-500">per hour</p>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                {item.category}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                Condition: Good
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                Posted {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Seller Info */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-300">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-1">
                  {item.sellerName}
                  {item.verified && <ShieldCheck size={14} className="text-green-500" />}
                </h3>
                <div className="flex items-center text-xs text-slate-500">
                  <span>★ {item.rating}</span>
                  <span className="mx-1">•</span>
                  <span>{item.college}</span>
                </div>
              </div>
            </div>
            {!isOwnItem && (
               <button 
                 onClick={() => onChat && onChat(item)}
                 className="p-3 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
               >
                 <MessageCircle size={20} />
               </button>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-bold text-slate-900 mb-3 text-lg">Description</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {item.description || "No description provided."}
            </p>
          </div>

          {/* Safety Notice */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-amber-800 text-sm mb-1">Meet in public places</h4>
              <p className="text-amber-700 text-xs">
                For your safety, always meet in busy campus locations like the library or student center. Never transfer money before seeing the item.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:relative md:border-none md:bg-transparent md:p-8 md:max-w-4xl md:mx-auto">
        <div className="flex gap-4">
           {!isOwnItem ? (
             <>
               <button 
                 onClick={() => onChat && onChat(item)}
                 className="flex-1 py-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
               >
                 <MessageCircle size={20} />
                 Chat
               </button>
               <button 
                 onClick={handleAction}
                 className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2"
               >
                 {item.type === 'SALE' ? <ShoppingBag size={20} /> : <Calendar size={20} />}
                 {getActionLabel()}
               </button>
             </>
           ) : (
             <button 
                onClick={onBack}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-xl font-bold cursor-not-allowed"
             >
               This is your listing
             </button>
           )}
        </div>
      </div>
    </div>
  );
};