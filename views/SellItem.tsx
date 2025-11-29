import React, { useState, useEffect } from 'react';
import { ChevronLeft, Camera, Sparkles, Loader2, X, AlertCircle, Upload, Save, Trash2, Image as ImageIcon } from 'lucide-react';
import { generateItemDescription, suggestPrice } from '../services/geminiService';
import { Category, UserProfile, Item } from '../types';
import { api } from '../services/api';

interface SellItemProps {
  onBack: () => void;
  user: UserProfile;
  itemToEdit?: Item | null;
}

export const SellItem: React.FC<SellItemProps> = ({ onBack, user, itemToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    category: Category.ELECTRONICS,
    type: 'SALE',
    price: '',
    condition: 'Good',
    description: '',
  });

  // Pre-fill form if editing
  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        title: itemToEdit.title,
        category: itemToEdit.category,
        type: itemToEdit.type,
        price: itemToEdit.price.toString(),
        condition: 'Good', // Defaults as condition isn't in main Item type yet
        description: itemToEdit.description || '',
      });
      setImagePreview(itemToEdit.image);
    }
  }, [itemToEdit]);

  const handleSmartGenerate = async () => {
    if (!formData.title) {
       setError("Please enter a title first!");
       return;
    }
    setError(null);
    setLoading(true);
    try {
      const [desc, price] = await Promise.all([
        generateItemDescription(
          formData.title,
          formData.category,
          formData.condition,
          "Used on campus"
        ),
        suggestPrice(formData.title)
      ]);
      
      setFormData(prev => ({
        ...prev,
        description: desc,
        price: price !== "N/A" && !isNaN(parseFloat(price)) ? price : prev.price
      }));
    } catch (err) {
      setError("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadProgress(0); // Reset progress for new file
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const handleDelete = async () => {
    if (!itemToEdit || !window.confirm("Are you sure you want to delete this listing?")) return;
    setDeleteLoading(true);
    try {
      await api.deleteItem(itemToEdit.id);
      onBack();
    } catch (err: any) {
      setError("Failed to delete item.");
      setDeleteLoading(false);
    }
  };

  const handleSave = async (status: 'ACTIVE' | 'DRAFT') => {
    // Basic validation
    if (!formData.title) {
      setError("Title is required.");
      return;
    }
    if (status === 'ACTIVE' && (!formData.price || (!imageFile && !itemToEdit?.image))) {
      setError("Active listings require a price and an image.");
      return;
    }

    if (status === 'ACTIVE') setPublishLoading(true);
    else setDraftLoading(true);
    
    setError(null);

    try {
      let imageUrl = itemToEdit?.image || '';

      // Upload Image if new one selected
      if (imageFile) {
        // Simulate progress for UX
        const interval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);
        
        const uploadedUrl = await api.uploadImage(imageFile);
        clearInterval(interval);
        setUploadProgress(100);
        
        if (!uploadedUrl) throw new Error("Image upload failed");
        imageUrl = uploadedUrl;
      }

      const itemData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        type: formData.type as any,
        image: imageUrl,
        status: status,
        originalPrice: parseFloat(formData.price) * 1.2 || 0,
      };

      if (itemToEdit) {
        // Update
        await api.updateItem(itemToEdit.id, itemData);
      } else {
        // Create
        await api.createItem(itemData, user.id, user.college);
      }

      onBack();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save item");
    } finally {
      setPublishLoading(false);
      setDraftLoading(false);
    }
  };

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen flex flex-col md:block">
      {/* Desktop Container */}
      <div className="flex-1 w-full max-w-3xl mx-auto bg-white md:rounded-3xl md:shadow-xl md:shadow-slate-200/50 md:my-12 md:border md:border-slate-100 overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-20 md:static md:px-8 md:py-6">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full md:hidden transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="flex-1 text-center font-bold text-slate-800 text-lg mr-8 md:mr-0 md:text-left md:text-2xl">
            {itemToEdit ? 'Edit Listing' : 'New Listing'}
          </h1>
          {itemToEdit && (
            <button 
              onClick={handleDelete}
              disabled={deleteLoading}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
              title="Delete Listing"
            >
              {deleteLoading ? <Loader2 size={24} className="animate-spin" /> : <Trash2 size={24} />}
            </button>
          )}
          <button onClick={onBack} className="hidden md:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all ml-2">
            <X size={24} />
          </button>
        </div>

        <div className="p-5 md:p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] md:max-h-none">
          {/* Image Upload */}
          <div className="space-y-3">
             <label className="block text-sm font-semibold text-slate-700">Photos</label>
             <div className="relative w-full h-52 md:h-72 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 cursor-pointer hover:bg-slate-50 hover:border-primary-400 transition-all group overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 z-10 cursor-pointer disabled:cursor-default"
                  disabled={!!imagePreview}
                />
                
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={clearImage}
                      className="absolute top-3 right-3 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors z-20"
                    >
                      <Trash2 size={16} />
                    </button>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                        <div 
                          className="h-full bg-primary-500 transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                      <Camera size={32} className="text-primary-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-primary-600 transition-colors">Click to add photo</span>
                    <span className="text-xs text-slate-400 mt-1">Max 10MB • JPEG, PNG</span>
                  </>
                )}
             </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Listing Type</label>
              <div className="relative">
                <select 
                  className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base outline-none appearance-none transition-shadow cursor-pointer"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="SALE">Sell Item</option>
                  <option value="RENT">Rent Out</option>
                  <option value="SWAP">Swap Item</option>
                  <option value="SERVICE">Offer Service</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronLeft size={20} className="-rotate-90" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
              <input 
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({...formData, title: e.target.value});
                  if (error) setError(null);
                }}
                placeholder="e.g. Calculus Textbook, Graphing Calculator"
                className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base outline-none transition-shadow placeholder:text-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                <div className="relative">
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as Category})}
                    className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base outline-none appearance-none transition-shadow cursor-pointer"
                  >
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                   <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <ChevronLeft size={20} className="-rotate-90" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price ($)</label>
                <input 
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="0.00"
                  className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base outline-none transition-shadow"
                />
              </div>
            </div>
          </div>

          {/* AI Assistant Section */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-sm transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 p-3 opacity-10">
               <Sparkles size={64} />
            </div>
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="text-indigo-900 font-bold text-sm md:text-base flex items-center">
                <Sparkles size={18} className="mr-2 text-indigo-500" /> 
                AI Smart Assistant
              </h3>
              <button 
                onClick={handleSmartGenerate}
                disabled={loading}
                className="text-xs font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-70 flex items-center shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                {loading ? <Loader2 size={14} className="animate-spin mr-2"/> : <Sparkles size={14} className="mr-2" />}
                {loading ? 'Thinking...' : 'Auto-Fill'}
              </button>
            </div>
            
            {error && (
              <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded-lg flex items-center">
                <AlertCircle size={14} className="mr-1.5" />
                {error}
              </div>
            )}
            
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detailed description of your item..."
              className="w-full p-4 bg-white/80 backdrop-blur rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base h-32 outline-none resize-none transition-shadow"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 md:pt-4 flex flex-col md:flex-row gap-3 md:justify-end pb-8 md:pb-0">
             <button 
               onClick={() => handleSave('DRAFT')}
               disabled={draftLoading || publishLoading}
               className="w-full md:w-auto px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center disabled:opacity-50"
             >
               {draftLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={20} />}
               Save Draft
             </button>
             
             <button 
               onClick={() => handleSave('ACTIVE')}
               disabled={draftLoading || publishLoading}
               className="w-full md:w-auto md:px-12 bg-slate-900 text-white py-4 rounded-xl font-bold text-base shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 disabled:active:scale-100"
             >
               {publishLoading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" size={20} />}
               {itemToEdit ? 'Update Listing' : 'Publish Listing'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};