
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto relative overflow-hidden flex items-center gap-3 p-4 rounded-xl shadow-xl border animate-in slide-in-from-top-2 fade-in duration-300
              ${toast.type === 'success' ? 'bg-white border-green-100 text-slate-800' : ''}
              ${toast.type === 'error' ? 'bg-white border-red-100 text-slate-800' : ''}
              ${toast.type === 'info' ? 'bg-white border-blue-100 text-slate-800' : ''}
            `}
          >
            {/* Progress Bar */}
            <div 
              className={`absolute bottom-0 left-0 h-1 ${
                toast.type === 'success' ? 'bg-green-500' : 
                toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ 
                width: '100%', 
                animation: `shrink ${toast.duration || 3000}ms linear forwards` 
              }}
            />
            
            {toast.type === 'success' && <CheckCircle size={24} className="text-green-500 shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={24} className="text-red-500 shrink-0" />}
            {toast.type === 'info' && <Info size={24} className="text-blue-500 shrink-0" />}
            <div className="flex-1">
               <p className="text-sm font-semibold">{toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Info'}</p>
               <p className="text-xs text-slate-500">{toast.message}</p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
