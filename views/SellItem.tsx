import React, { useState } from 'react';
import { ChevronLeft, Camera, Sparkles, Loader2, X } from 'lucide-react';
import { generateItemDescription, suggestPrice } from '../services/geminiService';
import { Category } from '../types';

interface SellItemProps {
  onBack: () => void;
}

export const SellItem: React.FC<SellItemProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: Category.ELECTRONICS,
    type: 'SALE',
    price: '',
    condition: 'Good',
    description: '',
  });

  const handleSmartGenerate = async () => {
    if (!formData.title) return alert("Please enter a title first!");
    
    setLoading(true);
    try {
      const desc = await generateItemDescription(
        formData.title,
        formData.category,
        formData.condition,
        "Used on campus for 1 year"
      );
      const price = await suggestPrice(formData.title);
      
      setFormData(prev => ({
        ...prev,
        description: desc,
        price: price !== "N/A" ? price : prev.price
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen">
      {/* Desktop Container */}
      <div className="max-w-2xl mx-auto bg-white md:rounded-2xl md:shadow-sm md:my-8 md:border md:border-slate-200 overflow-hidden min-h-screen md:min-h-0">
        
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10 md:static md:px-6 md:py-4">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full md:hidden">
            <ChevronLeft size={24} />
          </button>
          <h1 className="flex-1 text-center font-bold text-slate-800 mr-8 md:mr-0 md:text-left md:text-xl">Create New Listing</h1>
          <button onClick={onBack} className="hidden md:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* Image Upload */}
          <div className="w-full h-48 md:h-64 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors group">
            <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
              <Camera size={32} className="text-primary-500" />
            </div>
            <span className="text-sm font-medium text-slate-600">Click to add photos</span>
            <span className="text-xs text-slate-400 mt-1">Max 8 photos • JPEG, PNG</span>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Listing Type</label>
              <select 
                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 text-sm outline-none"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="SALE">Sell Item</option>
                <option value="RENT">Rent Out</option>
                <option value="SWAP">Swap Item</option>
                <option value="SERVICE">Offer Service</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input 
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Calculus Textbook, Graphing Calculator"
                className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
                  className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 text-sm outline-none"
                >
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
                <input 
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                  className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {/* AI Assistant Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-indigo-900 font-semibold text-sm flex items-center">
                <Sparkles size={16} className="mr-2 text-indigo-500" /> 
                AI Smart Assistant
              </h3>
              <button 
                onClick={handleSmartGenerate}
                disabled={loading || !formData.title}
                className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center shadow-sm transition-all active:scale-95"
              >
                {loading ? <Loader2 size={12} className="animate-spin mr-2"/> : null}
                Auto-Fill
              </button>
            </div>
            <p className="text-xs text-indigo-700 mb-4 leading-relaxed">
              Save time! Enter a title above, and Gemini AI will generate a description and suggest a fair price based on market data.
            </p>
            
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detailed description of your item..."
              className="w-full p-3 bg-white rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-500 text-sm h-32 outline-none resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 md:pt-4 md:flex md:justify-end">
             <button className="w-full md:w-auto md:px-8 bg-primary-600 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95">
               Publish Listing
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};