
import React, { useState, useEffect, useRef } from 'react';
/* Added ChevronRight to the lucide-react imports */
import { ChevronLeft, ChevronRight, Camera, Sparkles, Loader2, X, AlertCircle, Upload, Save, Trash2, Image as ImageIcon, Plus, ArrowLeft, ArrowRight, RefreshCw, GripHorizontal, Wand2, Mic, MicOff, Leaf, Timer, ScanLine, Tag, DollarSign, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { generateItemDescription, suggestPrice, analyzeImageForListing, checkImageSafety } from '../services/geminiService';
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
  const [publishLoading, setPublishLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const { showToast } = useToast();
  
  const [images, setImages] = useState<ImageUpload[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: Category.ELECTRONICS,
    type: 'SALE',
    price: '',
    condition: 'Good',
    description: '',
    tags: [] as string[],
    auctionDuration: '3'
  });

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        title: itemToEdit.title,
        category: itemToEdit.category,
        type: itemToEdit.type,
        price: itemToEdit.price.toString(),
        condition: 'Good',
        description: itemToEdit.description || '',
        tags: itemToEdit.tags || [],
        auctionDuration: '3'
      });
      setImages(itemToEdit.images.map((url, idx) => ({ id: `existing-${idx}`, url, status: 'complete', progress: 100 })));
    } else {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          setFormData(JSON.parse(savedDraft));
          setAutoSaveStatus('Draft restored');
          setTimeout(() => setAutoSaveStatus(''), 3000);
        } catch (e) {}
      }
    }
  }, [itemToEdit]);

  useEffect(() => {
    if (itemToEdit) return;
    const saveTimer = setInterval(() => {
      if (formData.title || formData.description) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
        setAutoSaveStatus('Auto-saved');
        setTimeout(() => setAutoSaveStatus(''), 2000);
      }
    }, 30000);
    return () => clearInterval(saveTimer);
  }, [formData, itemToEdit]);

  const handleAutoFillFromPhoto = async (specificFile?: File) => {
    const img = specificFile || images.find(i => i.file)?.file;
    if (!img) return showToast("Capture a photo first.", 'error');
    
    setAnalyzingPhoto(true);
    setAiAnalysisResult(null);
    
    try {
      const data = await analyzeImageForListing(img);
      if (data) {
        setAiAnalysisResult(data);
        setFormData(prev => ({ 
          ...prev, 
          title: data.title || prev.title,
          category: (Object.values(Category).includes(data.category as Category) ? data.category : prev.category) as Category,
          description: data.description || prev.description,
          condition: data.condition || prev.condition,
          price: data.price?.toString() || prev.price,
          tags: data.tags || []
        }));
        showToast("Complete listing generated!", 'success');
      }
    } catch (e) {
      showToast("AI analysis failed.", 'error');
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, isSnap = false) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as File[];
      const newImages: ImageUpload[] = newFiles.map(file => ({
        id: Math.random().toString(36).substring(7),
        url: URL.createObjectURL(file),
        file,
        status: 'pending',
        progress: 0
      }));
      setImages(prev => [...prev, ...newImages].slice(0, 8));
      newImages.forEach(img => uploadSingleImage(img, isSnap));
    }
  };

  const uploadSingleImage = async (img: ImageUpload, autoAnalyze = false) => {
    if (!img.file) return;
    try {
       setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'uploading', progress: 10 } : i));
       const isSafe = await checkImageSafety(img.file);
       if (!isSafe) throw new Error("Safety check failed");

       const publicUrl = await api.uploadImage(img.file);
       if (!publicUrl) throw new Error("Upload failed");

       setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'complete', url: publicUrl, progress: 100 } : i));
       
       if (autoAnalyze) {
          handleAutoFillFromPhoto(img.file);
       }
    } catch (e) {
       setImages(prev => prev.map(i => i.id === img.id ? { ...i, status: 'error', progress: 0 } : i));
       showToast("Image issue detected", 'error');
    }
  };

  const removeImage = (id: string) => setImages(prev => prev.filter(i => i.id !== id));

  const handleSave = async (status: 'ACTIVE' | 'DRAFT') => {
    if (!formData.title) return showToast("Title is required", 'error');
    status === 'ACTIVE' ? setPublishLoading(true) : setDraftLoading(true);
    try {
      const validUrls = images.filter(i => i.status === 'complete').map(i => i.url);
      const itemData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        images: validUrls,
        image: validUrls[0] || '',
        status,
        tags: formData.tags
      };
      itemToEdit ? await api.updateItem(itemToEdit.id, itemData) : await api.createItem(itemData, user.id, user.college);
      showToast(status === 'ACTIVE' ? "Published!" : "Draft Saved", 'success');
      if (!itemToEdit) localStorage.removeItem(DRAFT_STORAGE_KEY);
      onBack();
    } catch (e) {
      showToast("Failed to save", 'error');
    } finally {
      setPublishLoading(false);
      setDraftLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData({...formData, tags: [...formData.tags, tag]});
    }
  };

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen relative">
      
      {/* AI SCANNING OVERLAY */}
      {analyzingPhoto && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <div className="relative w-64 h-64 mb-12">
            {/* Pulsing Outer Rings */}
            <div className="absolute inset-0 bg-primary-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-4 bg-primary-500/30 rounded-full animate-ping [animation-delay:0.5s]"></div>
            
            {/* Rotating Gear/Ring */}
            <div className="absolute inset-0 border-4 border-dashed border-primary-400 rounded-full animate-[spin_10s_linear_infinite]"></div>
            
            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 bg-white rounded-[40px] shadow-[0_0_50px_rgba(14,165,233,0.4)] flex items-center justify-center relative overflow-hidden group">
                <Camera size={64} className="text-primary-600 animate-float" />
                {/* Scan Line Animation */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary-400/80 shadow-[0_0_15px_rgba(14,165,233,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">AI is identifying...</h2>
          <p className="text-slate-400 font-medium text-center max-w-sm italic">
            "Looking for category, pricing, and details..."
          </p>
          
          <div className="mt-12 flex gap-4">
             <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce [animation-delay:0s]"></div>
             <div className="w-3 h-3 bg-primary-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
             <div className="w-3 h-3 bg-primary-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto bg-white md:rounded-3xl md:shadow-xl md:my-12 overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-50 rounded-full"><ChevronLeft size={24} /></button>
          <div className="text-center">
            <h1 className="font-bold text-lg tracking-tight">{itemToEdit ? 'Edit Listing' : 'List Item'}</h1>
            {autoSaveStatus && <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">{autoSaveStatus}</p>}
          </div>
          <div className="w-10"></div>
        </div>

        {/* Snap & List Hero Action */}
        {!itemToEdit && images.length === 0 && !analyzingPhoto && (
           <div className="p-12 text-center bg-gradient-to-br from-indigo-50 to-primary-50 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl flex items-center justify-center mx-auto mb-8 animate-float group cursor-pointer hover:scale-105 transition-transform active:scale-95" onClick={() => fileInputRef.current?.click()}>
                   <div className="absolute inset-2 border-2 border-primary-100 rounded-[24px]"></div>
                   <ScanLine size={48} className="text-primary-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight leading-tight">Magic Listing</h2>
                <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                   Take a photo. Our AI handles the title, description, category, and price for you.
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[20px] font-bold shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all"
                >
                   <Camera size={24} /> Snap Item
                </button>
                <input type="file" ref={fileInputRef} accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageSelect(e, true)} />
              </div>
           </div>
        )}

        {/* AI SUMMARY CARD (Shown after analysis) */}
        {aiAnalysisResult && !analyzingPhoto && (
           <div className="p-6 bg-indigo-900 text-white animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-yellow-300">
                    <Sparkles size={22} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg leading-none">AI Insight Ready</h3>
                    <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mt-1">Check details below</p>
                 </div>
                 <button onClick={() => setAiAnalysisResult(null)} className="ml-auto p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X size={18} />
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1 text-indigo-300">
                       <Tag size={12} /> <span className="text-[10px] font-black uppercase">Category</span>
                    </div>
                    <p className="font-bold">{aiAnalysisResult.category}</p>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-1 text-indigo-300">
                       <DollarSign size={12} /> <span className="text-[10px] font-black uppercase">Suggested Price</span>
                    </div>
                    <p className="font-bold">${aiAnalysisResult.price}</p>
                 </div>
                 <div className="col-span-2 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2 text-indigo-300">
                       <Zap size={12} /> <span className="text-[10px] font-black uppercase">Auto-Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {aiAnalysisResult.tags?.map((tag: string) => (
                          <span key={tag} className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-lg">{tag}</span>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        )}

        <div className="p-6 space-y-8">
          {/* Gallery UI */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
             {images.map((img, idx) => (
               <div 
                 key={img.id}
                 className={`relative aspect-square rounded-2xl overflow-hidden border-2 group ${img.status === 'error' ? 'border-red-200' : 'border-slate-100 shadow-sm'}`}
               >
                 <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                 {img.status === 'uploading' && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm"><Loader2 className="animate-spin text-primary-500" /></div>}
                 <button onClick={() => removeImage(img.id)} className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-lg"><X size={12} /></button>
                 {idx === 0 && <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">Thumbnail</div>}
               </div>
             ))}
             {images.length > 0 && images.length < 8 && (
               <label className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-primary-500 hover:bg-primary-50/30 hover:text-primary-600 cursor-pointer transition-all">
                 <input type="file" multiple className="hidden" onChange={(e) => handleImageSelect(e)} />
                 <Plus size={28} />
                 <span className="text-[10px] font-black mt-2 uppercase tracking-widest">More</span>
               </label>
             )}
          </div>

          <div className="space-y-5">
             <div className="relative group">
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Listing Title" 
                  className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary-100 rounded-[20px] focus:bg-white focus:ring-4 focus:ring-primary-50/50 outline-none font-black text-xl placeholder:text-slate-300 transition-all" 
                />
                {formData.title && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-in zoom-in"><CheckCircle2 size={20} /></div>}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative">
                   <select 
                     value={formData.category} 
                     onChange={e => setFormData({...formData, category: e.target.value as Category})} 
                     className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-[20px] focus:bg-white outline-none focus:border-primary-100 font-bold appearance-none cursor-pointer transition-all"
                   >
                      {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
                </div>
                
                <div className="relative group">
                   <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-xl text-slate-400 group-focus-within:text-slate-900 transition-colors">$</span>
                   <input 
                     type="number" 
                     value={formData.price} 
                     onChange={e => setFormData({...formData, price: e.target.value})} 
                     placeholder="0.00" 
                     className="w-full p-5 pl-10 bg-slate-50 border-2 border-transparent focus:border-primary-100 rounded-[20px] focus:bg-white outline-none font-black text-xl placeholder:text-slate-200 transition-all" 
                   />
                </div>
             </div>

             <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Listing Details</h3>
                   <div className="flex gap-2">
                      {images.length > 0 && (
                        <button 
                          onClick={() => handleAutoFillFromPhoto()} 
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                        >
                           <Wand2 size={12} /> AI Re-Scan
                        </button>
                      )}
                   </div>
                </div>

                <div className="flex items-center gap-4 py-1">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Condition:</span>
                   <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                      {['New', 'Like New', 'Good', 'Fair', 'Poor'].map(c => (
                         <button 
                           key={c}
                           onClick={() => setFormData({...formData, condition: c})}
                           className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all whitespace-nowrap ${formData.condition === c ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                         >
                            {c}
                         </button>
                      ))}
                   </div>
                </div>

                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Describe the condition, what's included, and where you're willing to meet..." 
                  className="w-full h-36 bg-white border-2 border-transparent focus:border-primary-100 rounded-2xl outline-none focus:ring-0 text-sm p-4 resize-none font-medium leading-relaxed placeholder:text-slate-300 transition-all shadow-inner" 
                />

                <div className="space-y-3 pt-2">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      <Zap size={12} className="text-yellow-500" /> Discoverability Tags
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                         <span key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 animate-in zoom-in">
                            {tag}
                            <button onClick={() => setFormData({...formData, tags: formData.tags.filter(t => t !== tag)})}><X size={10} /></button>
                         </span>
                      ))}
                      {formData.tags.length < 5 && (
                         <input 
                           type="text" 
                           placeholder="Add tag..." 
                           onKeyDown={e => {
                              if (e.key === 'Enter') {
                                 e.preventDefault();
                                 addTag((e.target as HTMLInputElement).value);
                                 (e.target as HTMLInputElement).value = '';
                              }
                           }}
                           className="bg-transparent border-none text-[10px] font-bold focus:ring-0 w-20 placeholder:text-slate-300"
                         />
                      )}
                   </div>
                </div>
             </div>

             <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => handleSave('DRAFT')} 
                  disabled={draftLoading || publishLoading} 
                  className="flex-1 py-5 bg-slate-100 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95 disabled:opacity-50"
                >
                   {draftLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Save Draft'}
                </button>
                <button 
                  onClick={() => handleSave('ACTIVE')} 
                  disabled={publishLoading || draftLoading || images.length === 0} 
                  className="flex-[2] py-5 bg-slate-900 rounded-2xl font-bold text-white shadow-2xl shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                   {publishLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Publish Listing'}
                </button>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          50% { top: 100%; }
          90% { opacity: 1; }
          100% { top: 0%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
