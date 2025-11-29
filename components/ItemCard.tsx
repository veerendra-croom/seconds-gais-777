import React from 'react';
import { Item } from '../types';
import { MapPin, Star, ShieldCheck, Heart, Layers } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  const isRent = item.type === 'RENT';
  const isSwap = item.type === 'SWAP';
  const isService = item.type === 'SERVICE';
  const hasMultipleImages = item.images && item.images.length > 1;

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-800 shadow-sm uppercase tracking-wide z-10">
          {item.type}
        </div>
        
        {hasMultipleImages && (
          <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-white px-1.5 py-1 rounded-md shadow-sm z-10 flex items-center gap-1">
             <Layers size={12} />
             <span className="text-[10px] font-medium">{item.images.length}</span>
          </div>
        )}

        {item.verified && (
          <div className="absolute bottom-2 left-2 bg-green-500/90 backdrop-blur-sm text-white p-1 rounded-full shadow-sm z-10" title="Verified Student">
             <ShieldCheck size={14} />
          </div>
        )}

        <button className="absolute bottom-2 right-2 p-1.5 bg-white/90 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 z-10">
           <Heart size={16} />
        </button>
      </div>
      
      <div className="p-3.5">
        <div className="mb-1.5">
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-primary-600 transition-colors">{item.title}</h3>
        </div>
        
        <div className="flex items-baseline space-x-1.5 mb-2.5">
          {isSwap ? (
             <span className="text-sm md:text-base font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">SWAP</span>
          ) : (
            <>
              <span className="text-base md:text-lg font-bold text-slate-900">${item.price}</span>
              {isRent && <span className="text-xs text-slate-500 font-medium">/day</span>}
              {isService && <span className="text-xs text-slate-500 font-medium">/hr</span>}
              {item.originalPrice && !isRent && !isService && (
                <span className="text-xs text-slate-400 line-through font-medium">${item.originalPrice}</span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center text-xs text-slate-500 mb-2">
          <MapPin size={12} className="mr-1 text-slate-400" />
          <span className="truncate max-w-[120px]">{item.college}</span>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50">
          <span className="text-slate-600 font-medium truncate max-w-[80px]">{item.sellerName}</span>
          <div className="flex items-center bg-amber-50 px-1.5 py-0.5 rounded-md">
            <Star size={10} className="text-amber-500 fill-amber-500 mr-1" />
            <span className="text-amber-700 font-bold">{item.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};