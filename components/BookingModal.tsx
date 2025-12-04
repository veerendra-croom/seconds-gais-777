
import React, { useState } from 'react';
import { X, Calendar, Clock, Loader2, CheckCircle2 } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
  price: number;
  onConfirm: (date: string, time: string) => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, serviceTitle, price, onConfirm }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(date, time);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {success ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Booking Requested!</h2>
            <p className="text-slate-500">The provider will review your request shortly.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Book Service</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl">
                 <p className="text-xs font-bold text-slate-400 uppercase mb-1">Service</p>
                 <p className="font-semibold text-slate-800">{serviceTitle}</p>
                 <p className="text-sm text-primary-600 font-bold mt-1">${price}/hr</p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Calendar size={16} /> Select Date
                    </label>
                    <input 
                      type="date" 
                      required
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Clock size={16} /> Select Time
                    </label>
                    <input 
                      type="time" 
                      required
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                 </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : `Request Booking`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
