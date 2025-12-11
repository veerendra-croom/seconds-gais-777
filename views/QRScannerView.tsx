
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, Zap, ScanLine, Keyboard, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';

interface QRScannerViewProps {
  onBack: () => void;
  onScanSuccess: (code: string) => void;
  expectedCode?: string; // Kept in interface to avoid breaking calls but unused in logic
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({ onBack, onScanSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
        setHasPermission(false);
        setManualMode(true); // Fallback immediately
      }
    };

    if (!manualMode) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [manualMode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.length !== 6) {
      showToast("Code must be 6 digits", 'error');
      return;
    }
    
    // Directly pass to parent for server verification
    onScanSuccess(manualCode);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center">
        <button onClick={onBack} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors">
          <X size={24} />
        </button>
        <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white text-xs font-bold uppercase tracking-wider">
           Scan to Verify
        </div>
        <button 
          onClick={() => setManualMode(!manualMode)} 
          className={`p-3 backdrop-blur-md rounded-full text-white transition-colors ${manualMode ? 'bg-white text-black' : 'bg-black/40 hover:bg-black/60'}`}
        >
          <Keyboard size={24} />
        </button>
      </div>

      {manualMode ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 animate-in fade-in">
           <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8">
              <ScanLine size={40} className="text-white opacity-80" />
           </div>
           
           <h2 className="text-2xl font-bold text-white mb-2 text-center">Enter Meetup Code</h2>
           <p className="text-slate-400 text-sm text-center mb-8 max-w-xs">
              Ask the other person for the 6-digit code displayed on their Order Details screen.
           </p>

           <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-6">
              <input 
                type="text" 
                maxLength={6}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.replace(/\D/g,''))}
                placeholder="000 000"
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-6 text-center text-4xl font-mono font-bold text-white tracking-[0.5em] focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-700"
                autoFocus
              />
              
              <button 
                type="submit" 
                disabled={manualCode.length !== 6 || loading}
                className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/30 hover:bg-primary-500 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Verify Code'}
              </button>
           </form>
        </div>
      ) : (
        <div className="relative flex-1 bg-black flex flex-col justify-center items-center overflow-hidden">
           {/* Camera Feed */}
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted 
             className="absolute inset-0 w-full h-full object-cover opacity-80"
           />
           
           {/* Scanner Overlay */}
           <div className="absolute inset-0 border-[60px] border-black/60 z-10 pointer-events-none">
              <div className="relative w-full h-full border-2 border-white/30 rounded-xl overflow-hidden">
                 <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-xl"></div>
                 <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-xl"></div>
                 <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-xl"></div>
                 <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-xl"></div>
                 
                 {/* Scanning Animation */}
                 <div className="absolute left-0 right-0 h-0.5 bg-primary-500 shadow-[0_0_20px_rgba(14,165,233,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
              </div>
           </div>

           <p className="absolute bottom-32 z-20 text-white/80 font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
              Align code within frame
           </p>
        </div>
      )}
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
