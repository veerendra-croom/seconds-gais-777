
import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface VerificationViewProps {
  onVerificationComplete: () => void;
  userId: string;
}

export const VerificationView: React.FC<VerificationViewProps> = ({ onVerificationComplete, userId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !userId) return;
    setUploading(true);
    setError(null);

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-student-id.${fileExt}`;
      const filePath = `${fileName}`;

      // Note: "verifications" bucket must exist in Supabase
      const { error: uploadError } = await supabase.storage
        .from('verifications')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw new Error(`Upload Failed: ${uploadError.message}`);
      }

      // 2. Success Logic
      setCompleted(true);
      
      // Delay to show success animation before redirect
      setTimeout(() => {
        onVerificationComplete();
      }, 2000);

    } catch (error: any) {
      console.error("Verification error:", error);
      setError(error.message || "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl animate-fade-in">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Submission Received!</h2>
          <p className="text-slate-500">Your student ID is being verified. You have temporary access to browse the marketplace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pt-12 md:justify-center">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in">
        <div className="p-8 border-b border-slate-100 text-center">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <ShieldCheck size={32} />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 mb-2">Verify Student Status</h1>
           <p className="text-slate-500 text-sm">To ensure a safe trusted community, we need to verify you are a currently enrolled student.</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Upload Student ID Card</label>
            <div className="relative group cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              
              {preview ? (
                <div className="w-full h-64 rounded-2xl overflow-hidden border-2 border-slate-200 relative">
                  <img src={preview} alt="ID Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/20 backdrop-blur text-white px-4 py-2 rounded-lg font-medium">Change Photo</div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-64 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center bg-slate-50 group-hover:bg-slate-100 group-hover:border-primary-400 transition-all">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                    <Camera size={32} className="text-slate-400 group-hover:text-primary-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">Tap to take photo</span>
                  <span className="text-xs text-slate-400 mt-1">Make sure details are clear</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-amber-800 text-xs md:text-sm">
             <div className="shrink-0 mt-0.5">⚠️</div>
             <p>Your ID card must clearly show your <strong>Name</strong>, <strong>College Name</strong>, and <strong>Expiration Date</strong>.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-start text-red-600 text-sm">
               <AlertCircle size={16} className="mt-0.5 shrink-0" />
               <p>{error}</p>
            </div>
          )}

          <button 
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center"
          >
            {uploading ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={20} className="mr-2" />
                Submit for Verification
              </>
            )}
          </button>
          
          <button onClick={onVerificationComplete} className="w-full text-slate-400 text-xs font-medium hover:text-slate-600">
             Skip for now (Read Only Mode)
          </button>
        </div>
      </div>
    </div>
  );
};
