
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
  const isRequest = item.type === 'REQUEST';
  const hasMultipleImages = item.images && item.images.length > 1;

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-[20px] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer relative overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100 rounded-t-[20px]">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Glass Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg shadow-black/5 z-10 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">{item.type}</span>
        </div>
        
        {hasMultipleImages && (
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white px-2 py-1 rounded-lg shadow-sm z-10 flex items-center gap-1.5">
             <Layers size={10} />
             <span className="text-[10px] font-medium">{item.images.length}</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
           {item.verified && (
             <div className="bg-green-500/90 backdrop-blur text-white p-1.5 rounded-full shadow-lg" title="Verified Student">
                <ShieldCheck size={14} />
             </div>
           )}
           <button className="bg-white text-slate-800 p-2 rounded-full shadow-lg hover:text-red-500 hover:scale-110 transition-all">
              <Heart size={16} />
           </button>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors">{item.title}</h3>
        </div>
        
        <div className="flex items-baseline space-x-1 mb-3">
          {isSwap ? (
             <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">SWAP ONLY</span>
          ) : isRequest ? (
             <span className="text-sm font-black text-slate-700">Budget: ${item.price}</span>
          ) : (
            <>
              <span className="text-lg font-black text-slate-900 tracking-tight">${item.price}</span>
              {isRent && <span className="text-xs text-slate-400 font-medium">/day</span>}
              {isService && <span className="text-xs text-slate-400 font-medium">/hr</span>}
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center text-xs text-slate-500">
            <MapPin size={12} className="mr-1 text-slate-300" />
            <span className="truncate max-w-[80px]">{item.college}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
              <Star size={10} className="text-amber-500 fill-amber-500 mr-1" />
              <span className="text-[10px] font-bold text-amber-700">{item.rating}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
