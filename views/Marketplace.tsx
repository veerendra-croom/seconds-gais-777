import React, { useState } from 'react';
import { Item, ModuleType, Category } from '../types';
import { ItemCard } from '../components/ItemCard';
import { Filter, ChevronLeft, Search } from 'lucide-react';
import { MOCK_ITEMS } from '../constants';

interface MarketplaceProps {
  type: ModuleType;
  onBack: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ type, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const mapModuleToItemType = (mod: ModuleType) => {
    switch(mod) {
      case 'BUY': return 'SALE';
      case 'RENT': return 'RENT';
      case 'SWAP': return 'SWAP';
      case 'EARN': return 'SERVICE';
      default: return 'SALE';
    }
  };

  const currentItemType = mapModuleToItemType(type);
  
  const filteredItems = MOCK_ITEMS.filter(
    item => item.type === currentItemType && 
    (selectedCategory === 'All' || item.category === selectedCategory)
  );

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 shadow-sm md:shadow-none md:border-b md:border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center px-4 py-3 md:py-6">
            <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full md:hidden">
              <ChevronLeft size={24} />
            </button>
            <h1 className="flex-1 text-center md:text-left font-bold text-slate-800 text-lg md:text-2xl mr-8 md:mr-0">
              {type === 'BUY' ? 'Buy Items' : type === 'EARN' ? 'Find Services' : type}
            </h1>
            
            {/* Desktop Search Filter Placeholder */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-100 rounded-lg px-3 py-2 w-64">
              <Search size={16} className="text-slate-400"/>
              <input type="text" placeholder="Search category..." className="bg-transparent border-none outline-none text-sm w-full" />
            </div>
          </div>
          
          {/* Categories Scroller */}
          <div className="flex overflow-x-auto px-4 py-2 space-x-2 no-scrollbar md:pb-4">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border ${
                selectedCategory === 'All' 
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              All
            </button>
            {Object.values(Category).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border ${
                  selectedCategory === cat 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-500">
            Showing {filteredItems.length} results
          </p>
          <button className="flex items-center space-x-1 text-xs md:text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
            <Filter size={14} />
            <span>Filter</span>
          </button>
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="bg-slate-100 p-4 rounded-full mb-3">
              <Filter size={32} />
            </div>
            <p className="text-sm">No items found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};