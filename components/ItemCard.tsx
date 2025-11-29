import React from 'react';
import { Item } from '../types';
import { MapPin, Star, ShieldCheck } from 'lucide-react';

interface ItemCardProps {
  item: Item;
  onClick?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  const isRent = item.type === 'RENT';
  const isSwap = item.type === 'SWAP';
  const isService = item.type === 'SERVICE';

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="relative aspect-square">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-slate-800 shadow-sm">
          {item.type}
        </div>
        {item.verified && (
          <div className="absolute bottom-2 left-2 bg-green-500/90 text-white p-1 rounded-full shadow-sm" title="Verified Student">
             <ShieldCheck size={12} />
          </div>
        )}
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-1">{item.title}</h3>
        </div>
        
        <div className="flex items-baseline space-x-1 mb-2">
          {isSwap ? (
             <span className="text-lg font-bold text-purple-600">SWAP</span>
          ) : (
            <>
              <span className="text-lg font-bold text-slate-900">${item.price}</span>
              {isRent && <span className="text-xs text-slate-500">/day</span>}
              {isService && <span className="text-xs text-slate-500">/hr</span>}
              {item.originalPrice && !isRent && !isService && (
                <span className="text-xs text-slate-400 line-through">${item.originalPrice}</span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center text-xs text-slate-500 mb-1">
          <MapPin size={12} className="mr-1" />
          <span className="truncate">{item.college}</span>
        </div>

        <div className="flex items-center justify-between text-xs mt-2 border-t border-slate-50 pt-2">
          <span className="text-slate-600 truncate max-w-[80px]">{item.sellerName}</span>
          <div className="flex items-center text-amber-400">
            <Star size={10} fill="currentColor" />
            <span className="ml-1 text-slate-600">{item.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};