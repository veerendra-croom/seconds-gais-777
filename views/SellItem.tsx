
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Camera, Sparkles, Loader2, X, AlertCircle, Upload, Save, Trash2, Image as ImageIcon, Plus, ArrowLeft, ArrowRight, RefreshCw, GripHorizontal, Wand2, Mic, MicOff, Leaf, Timer } from 'lucide-react';
import { generateItemDescription, suggestPrice, analyzeImageForListing, analyzeAudioForListing, checkImageSafety } from '../services/geminiService';
import { Category, UserProfile, Item } from '../types';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

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
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const { showToast } = useToast();
  
  // Media State
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    category: Category.ELECTRONICS,
    type: 'SALE',
    price: '',
    condition: 'Good',
    description: '',
    auctionDuration: '3' // Default 3 days for auction
  });

  // 1. Load Data
  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        title: itemToEdit.title,
        category: itemToEdit.category,
        type: itemToEdit.type,
        price: itemToEdit.price.toString(),
        condition: 'Good',
        description: itemToEdit.description || '',
        auctionDuration: '3'
      });
      const loadedImages = itemToEdit.images.map((url, idx) => ({
        id: `existing-${idx}`,
        url,
        status: 'complete' as const,
        progress: 100
      }));
      setImages(loadedImages);
    } else {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.title || parsed.description || parsed.price) {
             setFormData(parsed);
             setAutoSaveStatus('Draft restored');
             setTimeout(() => setAutoSaveStatus(''), 3000);
          }
        } catch (e) {}
      }
    }
  }, [itemToEdit]);

  // 2. Auto-Save Logic
  useEffect(() => {
    if (itemToEdit) return;
    const saveTimer = setInterval(() => {
      if (formData.title || formData.description || formData.price) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        setAutoSaveStatus('Auto-saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }
    }, 30000);
    return () => clearInterval(saveTimer);
  }, [formData, itemToEdit]);

  useEffect(() => {
    if (formData.type === 'SHARE' && !formData.price) {
      setFormData(prev => ({...prev, price: '0'}));
    }
  }, [formData.type]);

  const handleSmartGenerate = async () => {
    if (!formData.title) {
       showToast("Please enter a title first!", 'error');
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
          formData.type === 'REQUEST' ? "Looking for this item" : "Used on campus"
        ),
        suggestPrice(formData.title)
      ]);
      
      setFormData(prev => ({
        ...prev,
        description: desc,
        price: price !== "N/A" && !isNaN(parseFloat(price)) ? price : prev.price
      }));
      showToast("Description generated!", 'success');
    } catch (err) {
      showToast("Failed to generate content.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFillFromPhoto = async () => {
    const firstImageUpload = images.find(i => i.file);
    if (!firstImageUpload || !firstImageUpload.file) {
      showToast("Please upload a photo first.", 'error');
      return;
    }
    setAnalyzingPhoto(true);
    showToast("Analyzing photo...", 'info');
    try {
      const data = await analyzeImageForListing(firstImageUpload.file);
      if (data) {
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          category: data.category || prev.category,
          price: data.price ? data.price.toString() : prev.price,
          description: data.description || prev.description,
          condition: data.condition || prev.condition
        }));
        showToast("Auto-fill complete!", 'success');
      } else {
        showToast("Could not identify item details.", 'error');
      }
    } catch (e) {
      showToast("Analysis failed.", 'error');
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorderRef.current.onstop = handleRecordingStop;
      mediaRecorderRef.current.start();
      setIsRecording(true);
      showToast("Listening... describe your item", 'info');
    } catch (err) { showToast("Microphone access denied", 'error'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleRecordingStop = async () => {
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    setProcessingAudio(true);
    showToast("Processing audio...", 'info');
    try {
      const data = await analyzeAudioForListing(audioBlob);
      if (data) {
        setFormData(prev => ({
          ...prev,
          title: data.title || prev.title,
          category: data.category || prev.category,
          price: data.price ? data.price.toString() : prev.price,
          description: data.description || prev.description,
          condition: data.condition || prev.condition,
          type: data.type || prev.type
        }));
        showToast("Details extracted from voice!", 'success');
      }
    } catch (e) { showToast("Voice analysis failed.", 'error'); } 
    finally { setProcessingAudio(false); }
  };

  const handleVoiceButtonClick = () => {
    if (isRecording) stopRecording(); else startRecording();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newImages: ImageUpload[] = newFiles.map((file: File) => ({
        id: Math.random().toString(36).substring(7),
        url: URL.createObjectURL(file), // Preview
        file,
        status: 'pending',
        progress: 0
      }));
      
      const totalImages = [...images, ...newImages].slice(0, 8);
      setImages(totalImages);
      
      newImages.forEach(img => {
        if (totalImages.find(i => i.id === img.id)) {
           uploadSingleImage(img);
        }
      });
    }
  };

  const uploadSingleImage = async (img: ImageUpload) => {
    if (!img.file) return;

    // 1. Safety Check with Gemini
    try {
       setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'uploading', progress: 10 } : i));
       const isSafe = await checkImageSafety(img.file);
       
       if (!isSafe) {
          throw new Error("Image detected as inappropriate.");
       }
    } catch (e: any) {
       console.error(e);
       setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', progress: 0 } : i));
       showToast("Image flagged as unsafe.", 'error');
       return;
    }

    // 2. Upload
    setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'uploading', progress: 30 } : i));
    const interval = setInterval(() => {
      setImages(prev => prev.map(i => {
        if (i.id === img.id && i.status === 'uploading' && i.progress < 90) return { ...i, progress: i.progress + 10 };
        return i;
      }));
    }, 300);

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
      showToast("Upload failed.", 'error');
    }
  };

  const retryUpload = (img: ImageUpload) => {
    if (img.status === 'error' && img.file) uploadSingleImage(img);
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(i => i.id !== id));
  };

  // ... (Drag and drop logic same as before) ...
  const onDragStart = (e: React.DragEvent, index: number) => { setDraggedImageIndex(index); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === dropIndex) return;
    const newImages = [...images];
    const draggedImage = newImages[draggedImageIndex];
    newImages.splice(draggedImageIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    setImages(newImages);
    setDraggedImageIndex(null);
  };

  const handleDelete = async () => {
    if (!itemToEdit || !window.confirm("Are you sure you want to delete this listing?")) return;
    setDeleteLoading(true);
    try {
      await api.deleteItem(itemToEdit.id);
      showToast("Listing deleted", 'success');
      onBack();
    } catch (err) {
      showToast("Failed to delete item", 'error');
      setDeleteLoading(false);
    }
  };

  const handleSave = async (status: 'ACTIVE' | 'DRAFT') => {
    if (!formData.title) { showToast("Title is required.", 'error'); return; }
    
    if (status === 'ACTIVE') {
      if (!formData.price && formData.type !== 'REQUEST' && formData.type !== 'SHARE') { showToast("Price is required.", 'error'); return; }
      if (images.length === 0 && formData.type !== 'REQUEST') { showToast("Image is required.", 'error'); return; }
    }

    if (status === 'ACTIVE') setPublishLoading(true); else setDraftLoading(true);
    
    try {
      const validImageUrls = images.filter(i => i.status === 'complete').map(i => i.url);
      
      // Calculate auction end time
      let auctionEndsAt = undefined;
      if (formData.type === 'AUCTION') {
         const endDate = new Date();
         endDate.setDate(endDate.getDate() + parseInt(formData.auctionDuration));
         auctionEndsAt = endDate.toISOString();
      }

      const itemData = {
        title: formData.title,
        description: formData.description,
        price: Math.abs(parseFloat(formData.price)) || 0,
        category: formData.category,
        type: formData.type as any,
        images: validImageUrls,
        image: validImageUrls[0] || '',
        status: status,
        originalPrice: Math.abs(parseFloat(formData.price)) * 1.2 || 0,
        auctionEndsAt: auctionEndsAt
      };

      if (itemToEdit) {
        await api.updateItem(itemToEdit.id, itemData);
        showToast("Listing updated!", 'success');
      } else {
        await api.createItem(itemData, user.id, user.college);
        showToast(status === 'ACTIVE' ? (formData.type === 'AUCTION' ? "Auction Started!" : "Published!") : "Draft saved", 'success');
      }
      if (!itemToEdit) localStorage.removeItem(DRAFT_STORAGE_KEY);
      onBack();
    } catch (err: any) {
      showToast(err.message || "Failed to save", 'error');
    } finally {
      setPublishLoading(false);
      setDraftLoading(false);
    }
  };

  const getPriceLabel = () => {
    switch (formData.type) {
      case 'REQUEST': return 'Max Budget ($)';
      case 'RENT': return 'Daily Rate ($)';
      case 'SERVICE': return 'Hourly Rate ($)';
      case 'SHARE': return 'Deposit/Fee (Optional)';
      case 'AUCTION': return 'Starting Bid ($)';
      default: return 'Price ($)';
    }
  };

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen flex flex-col md:block">
      <div className="flex-1 w-full max-w-3xl mx-auto bg-white md:rounded-3xl md:shadow-xl md:shadow-slate-200/50 md:my-12 md:border md:border-slate-100 overflow-hidden relative">
        <div className="flex items-center px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-20 md:static md:px-8 md:py-6">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full md:hidden transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 mr-8 md:mr-0">
             <h1 className="text-center md:text-left font-bold text-slate-800 text-lg md:text-2xl">{itemToEdit ? 'Edit Listing' : 'New Listing'}</h1>
             {autoSaveStatus && <p className="text-center md:text-left text-xs text-green-600 font-medium animate-pulse">{autoSaveStatus}</p>}
          </div>
          {itemToEdit && (
            <button onClick={handleDelete} disabled={deleteLoading} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all">
              {deleteLoading ? <Loader2 size={24} className="animate-spin" /> : <Trash2 size={24} />}
            </button>
          )}
          <button onClick={onBack} className="hidden md:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all ml-2"><X size={24} /></button>
        </div>

        <div className="p-5 md:p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-80px)] md:max-h-none">
          {/* Image Upload Gallery */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-700">Photos ({images.length}/8)</label>
                <span className="text-xs text-slate-400">Drag to reorder</span>
             </div>
             
             <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
               {images.map((img, idx) => (
                 <div 
                   key={img.id}
                   draggable
                   onDragStart={(e) => onDragStart(e, idx)}
                   onDragOver={(e) => onDragOver(e, idx)}
                   onDrop={(e) => onDrop(e, idx)}
                   className={`relative aspect-square rounded-xl overflow-hidden border transition-all cursor-move bg-slate-50 group ${draggedImageIndex === idx ? 'opacity-50 border-primary-400 border-2 border-dashed' : 'border-slate-200'}`}
                 >
                   <img src={img.url} className="w-full h-full object-cover pointer-events-none select-none" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                      <div className="flex justify-end"><button onClick={() => removeImage(img.id)} className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"><X size={12} /></button></div>
                      <div className="hidden md:flex justify-center text-white/50"><GripHorizontal size={16} /></div>
                   </div>
                   {img.status === 'uploading' && (
                     <div className="absolute inset-0 bg-white/80 flex items-center justify-center flex-col p-2 z-10">
                       <Loader2 className="animate-spin text-primary-500 mb-1" size={20} />
                       <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${img.progress}%` }}></div></div>
                     </div>
                   )}
                   {img.status === 'error' && (
                     <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center p-2 z-10 text-center">
                        <span className="text-red-500 text-xs font-bold mb-1">Unsafe/Failed</span>
                        <button onClick={() => retryUpload(img)} className="flex items-center gap-1 bg-white border border-red-200 text-red-600 px-2 py-1 rounded text-[10px] font-medium hover:bg-red-50"><RefreshCw size={10} /> Retry</button>
                     </div>
                   )}
                 </div>
               ))}
               {images.length < 8 && (
                 <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-primary-400 hover:text-primary-500 transition-all cursor-pointer">
                   <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                   <Plus size={24} className="mb-1" />
                   <span className="text-xs font-medium">Add Photo</span>
                 </label>
               )}
             </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Listing Type</label>
              <div className="relative">
                <select className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 text-base outline-none" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="SALE">Fixed Price Sale</option>
                  <option value="AUCTION">Auction (Bidding)</option>
                  <option value="RENT">Rent Out</option>
                  <option value="SWAP">Swap Item</option>
                  <option value="SERVICE">Offer Service</option>
                  <option value="SHARE">Share (Free/Low Cost)</option>
                  <option value="REQUEST">Request Item</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{formData.type === 'REQUEST' ? 'What do you need?' : 'Title'}</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Calculus Textbook" className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                <div className="relative">
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value as Category})} className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 text-base outline-none">
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{getPriceLabel()}</label>
                <input type="number" min="0" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="w-full p-3.5 bg-white rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>

            {/* Auction Duration Config */}
            {formData.type === 'AUCTION' && (
               <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                     <Timer size={18} className="text-orange-600" />
                     <span className="font-bold text-orange-800 text-sm">Auction Duration</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                     {['1', '3', '7'].map(day => (
                        <button
                           key={day}
                           onClick={() => setFormData({...formData, auctionDuration: day})}
                           className={`py-2 rounded-lg text-sm font-bold border transition-all ${formData.auctionDuration === day ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-white text-slate-600 border-orange-200 hover:bg-orange-100'}`}
                        >
                           {day} Days
                        </button>
                     ))}
                  </div>
                  <p className="text-xs text-orange-700 mt-2">
                     Highest bid at the end of {formData.auctionDuration} days wins. You can accept earlier manually.
                  </p>
               </div>
            )}
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10"><Sparkles size={64} /></div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 relative z-10 gap-3">
              <h3 className="text-indigo-900 font-bold text-sm md:text-base flex items-center"><Sparkles size={18} className="mr-2 text-indigo-500" /> AI Smart Assistant</h3>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button onClick={handleVoiceButtonClick} disabled={processingAudio} className="flex-1 sm:flex-none text-xs font-semibold px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center justify-center shadow-md">
                  {processingAudio ? <Loader2 size={14} className="animate-spin mr-2"/> : isRecording ? <MicOff size={14} className="mr-2" /> : <Mic size={14} className="mr-2" />}
                  {processingAudio ? 'Processing...' : isRecording ? 'Stop Recording' : 'Speak to List'}
                </button>
                {images.some(i => i.file) && (
                  <button onClick={handleAutoFillFromPhoto} disabled={analyzingPhoto || loading} className="flex-1 sm:flex-none text-xs font-semibold bg-violet-600 text-white px-3 py-2 rounded-lg hover:bg-violet-700 flex items-center justify-center shadow-lg shadow-violet-200">
                    {analyzingPhoto ? <Loader2 size={14} className="animate-spin mr-2"/> : <Camera size={14} className="mr-2" />}
                    {analyzingPhoto ? 'Analyzing...' : 'Auto-Fill'}
                  </button>
                )}
                <button onClick={handleSmartGenerate} disabled={loading || analyzingPhoto} className="flex-1 sm:flex-none text-xs font-semibold bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
                  {loading ? <Loader2 size={14} className="animate-spin mr-2"/> : <Wand2 size={14} className="mr-2" />}
                  {loading ? 'Thinking...' : 'Auto-Describe'}
                </button>
              </div>
            </div>
            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Detailed description..." className="w-full p-4 bg-white/80 backdrop-blur rounded-xl border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32" />
          </div>

          <div className="pt-2 md:pt-4 flex flex-col md:flex-row gap-3 md:justify-end pb-8 md:pb-0">
             <button onClick={() => handleSave('DRAFT')} disabled={draftLoading || publishLoading} className="w-full md:w-auto px-6 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center disabled:opacity-50">
               {draftLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={20} />} Save Draft
             </button>
             <button onClick={() => handleSave('ACTIVE')} disabled={draftLoading || publishLoading} className="w-full md:w-auto md:px-12 bg-slate-900 text-white py-4 rounded-xl font-bold text-base shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70">
               {publishLoading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" size={20} />} {itemToEdit ? 'Update' : (formData.type === 'AUCTION' ? 'Start Auction' : 'Publish')}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
