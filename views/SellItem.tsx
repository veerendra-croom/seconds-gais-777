import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Camera, Sparkles, Loader2, X, AlertCircle, Upload, Save, Trash2, Image as ImageIcon, Plus, ArrowLeft, ArrowRight, RefreshCw, GripHorizontal } from 'lucide-react';
import { generateItemDescription, suggestPrice } from '../services/geminiService';
import { Category, UserProfile, Item } from '../types';
import { api } from '../services/api';

interface SellItemProps {
  onBack: () => void;
  user: UserProfile;
  itemToEdit?: Item | null;
}

interface ImageUpload {
  id: string;
  url: string;
  file?: File;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress: number;
}

const DRAFT_STORAGE_KEY = 'seconds_app_new_listing_draft';

export const SellItem: React.FC<SellItemProps> = ({ onBack, user, itemToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  
  // Media State
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: Category.ELECTRONICS,
    type: 'SALE',
    price: '',
    condition: 'Good',
    description: '',
  });

  // 1. Load Data (Edit Mode OR Auto-Saved Draft)
  useEffect(() => {
    if (itemToEdit) {
      // Edit Mode
      setFormData({
        title: itemToEdit.title,
        category: itemToEdit.category,
        type: itemToEdit.type,
        price: itemToEdit.price.toString(),
        condition: 'Good',
        description: itemToEdit.description || '',
      });
      
      const loadedImages = itemToEdit.images.map((url, idx) => ({
        id: `existing-${idx}`,
        url,
        status: 'complete' as const,
        progress: 100
      }));
      setImages(loadedImages);
    } else {
      // Check for Draft
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Only restore if it looks valid
          if (parsed.title || parsed.description || parsed.price) {
             setFormData(parsed);
             setAutoSaveStatus('Draft restored');
             setTimeout(() => setAutoSaveStatus(''), 3000);
          }
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [itemToEdit]);

  // 2. Auto-Save Logic (Only for new items)
  useEffect(() => {
    if (itemToEdit) return; // Don't auto-save over editing items yet, complex state

    const saveTimer = setInterval(() => {
      if (formData.title || formData.description || formData.price) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        setAutoSaveStatus('Auto-saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveTimer);
  }, [formData, itemToEdit]);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newImages: ImageUpload[] = newFiles.map((file: File) => ({
        id: Math.random().toString(36).substring(7),
        url: URL.createObjectURL(file), // Preview URL
        file,
        status: 'pending',
        progress: 0
      }));
      
      // Limit to 8 total
      const totalImages = [...images, ...newImages].slice(0, 8);
      setImages(totalImages);
      
      // Trigger uploads for new pending images
      newImages.forEach(img => {
        if (totalImages.find(i => i.id === img.id)) {
           uploadSingleImage(img);
        }
      });
    }
  };

  const uploadSingleImage = async (img: ImageUpload) => {
    if (!img.file) return;

    setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'uploading' } : i));

    // Simulate progress intervals for UX
    const interval = setInterval(() => {
      setImages(prev => prev.map(i => {
        if (i.id === img.id && i.status === 'uploading' && i.progress < 90) {
          return { ...i, progress: i.progress + 10 };
        }
        return i;
      }));
    }, 200);

    try {
      const publicUrl = await api.uploadImage(img.file);
      clearInterval(interval);
      
      if (publicUrl) {
         setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'complete', url: publicUrl, progress: 100 } : i));
      } else {
         throw new Error("Upload failed");
      }
    } catch (err) {
      clearInterval(interval);
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', progress: 0 } : i));
    }
  };

  const retryUpload = (img: ImageUpload) => {
    if (img.status === 'error' && img.file) {
      uploadSingleImage(img);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(i => i.id !== id));
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index);
    // Required for Firefox
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedImageIndex];

    // Remove from old position
    newImages.splice(draggedImageIndex, 1);
    // Insert at new position
    newImages.splice(dropIndex, 0, draggedImage);

    setImages(newImages);
    setDraggedImageIndex(null);
  };

  // Fallback buttons for accessibility/mobile
  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index > 0) {
      const newImages = [...images];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      setImages(newImages);
    } else if (direction === 'right' && index < images.length - 1) {
      const newImages = [...images];
      [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
      setImages(newImages);
    }
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
    // Validation
    if (!formData.title) {
      setError("Title is required.");
      return;
    }
    
    // Check pending uploads
    const pendingUploads = images.some(i => i.status === 'uploading' || i.status === 'pending');
    if (pendingUploads) {
      setError("Please wait for images to finish uploading.");
      return;
    }

    if (status === 'ACTIVE') {
      if (!formData.price) {
        setError("Price is required for active listings.");
        return;
      }
      if (images.length === 0) {
        setError("At least one image is required for active listings.");
        return;
      }
    }

    if (status === 'ACTIVE') setPublishLoading(true);
    else setDraftLoading(true);
    
    setError(null);

    try {
      // Collect valid URLs
      const validImageUrls = images
        .filter(i => i.status === 'complete')
        .map(i => i.url);

      const itemData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        category: formData.category,
        type: formData.type as any,
        images: validImageUrls,
        image: validImageUrls[0] || '',
        status: status,
        originalPrice: parseFloat(formData.price) * 1.2 || 0,
      };

      if (itemToEdit) {
        await api.updateItem(itemToEdit.id, itemData);
      } else {
        await api.createItem(itemData, user.id, user.college);
      }

      // Clear draft if successful
      if (!itemToEdit) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
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
          <div className="flex-1 mr-8 md:mr-0">
             <h1 className="text-center md:text-left font-bold text-slate-800 text-lg md:text-2xl">
              {itemToEdit ? 'Edit Listing' : 'New Listing'}
             </h1>
             {autoSaveStatus && (
               <p className="text-center md:text-left text-xs text-green-600 font-medium animate-pulse">{autoSaveStatus}</p>
             )}
          </div>

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
          {/* Image Upload Gallery */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-700">Photos ({images.length}/8)</label>
                <span className="text-xs text-slate-400">Drag to reorder</span>
             </div>
             
             <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
               {/* Image Cards */}
               {images.map((img, idx) => (
                 <div 
                   key={img.id}
                   draggable
                   onDragStart={(e) => onDragStart(e, idx)}
                   onDragOver={(e) => onDragOver(e, idx)}
                   onDrop={(e) => onDrop(e, idx)}
                   className={`
                     relative aspect-square rounded-xl overflow-hidden border transition-all cursor-move bg-slate-50 group
                     ${draggedImageIndex === idx ? 'opacity-50 border-primary-400 border-2 border-dashed' : 'border-slate-200'}
                   `}
                 >
                   <img src={img.url} alt={`Upload ${idx}`} className="w-full h-full object-cover pointer-events-none select-none" />
                   
                   {/* Overlay controls */}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-end">
                        <button onClick={() => removeImage(img.id)} className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                          <X size={12} />
                        </button>
                      </div>
                      
                      {/* Mobile Move Controls (since drag isn't great on mobile) */}
                      <div className="flex justify-between md:hidden">
                         <button 
                           onClick={() => moveImage(idx, 'left')} 
                           disabled={idx === 0}
                           className="bg-white/20 hover:bg-white/40 text-white p-1 rounded disabled:opacity-0"
                         >
                           <ArrowLeft size={12} />
                         </button>
                         <button 
                           onClick={() => moveImage(idx, 'right')}
                           disabled={idx === images.length - 1}
                           className="bg-white/20 hover:bg-white/40 text-white p-1 rounded disabled:opacity-0"
                         >
                           <ArrowRight size={12} />
                         </button>
                      </div>
                      
                      {/* Desktop Drag Handle Hint */}
                      <div className="hidden md:flex justify-center text-white/50">
                        <GripHorizontal size={16} />
                      </div>
                   </div>

                   {/* Status Indicator */}
                   {img.status === 'uploading' && (
                     <div className="absolute inset-0 bg-white/80 flex items-center justify-center flex-col p-2 z-10">
                       <Loader2 className="animate-spin text-primary-500 mb-1" size={20} />
                       <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${img.progress}%` }}></div>
                       </div>
                     </div>
                   )}
                   {img.status === 'error' && (
                     <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center p-2 z-10 text-center">
                        <span className="text-red-500 text-xs font-bold mb-1">Failed</span>
                        <button 
                          onClick={() => retryUpload(img)}
                          className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2 py-1 rounded text-[10px] font-medium hover:bg-red-50"
                        >
                          <RefreshCw size={10} /> Retry
                        </button>
                     </div>
                   )}
                 </div>
               ))}

               {/* Add Button */}
               {images.length < 8 && (
                 <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary-400 hover:text-primary-500 transition-all cursor-pointer">
                   <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      className="hidden" 
                      onChange={handleImageSelect}
                   />
                   <Plus size={24} className="mb-1" />
                   <span className="text-xs font-medium">Add Photo</span>
                 </label>
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