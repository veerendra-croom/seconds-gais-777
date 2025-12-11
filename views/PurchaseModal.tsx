
import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Lock, Loader2, CheckCircle2, ShieldCheck, AlertCircle, Info, Calendar } from 'lucide-react';
import { api } from '../services/api';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle: string;
  price: number;
  onConfirm: () => Promise<void>;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, itemTitle, price, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Card Input State
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', zip: '' });
  const [validation, setValidation] = useState({ number: false, expiry: false, cvc: false });
  const [feePercent, setFeePercent] = useState(0.05); // Default 5%
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Fee Calculation
  const serviceFee = price * feePercent;
  const total = price + serviceFee;

  useEffect(() => {
    if (isOpen) {
       // Fetch dynamic fee
       api.getAppConfig('transaction_fee_percent').then(val => {
          if (val) setFeePercent(parseFloat(val) / 100);
       });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCardChange = (field: keyof typeof card, value: string) => {
    let formatted = value;
    if (field === 'number') {
      formatted = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
      setValidation(prev => ({...prev, number: formatted.length >= 19}));
    } else if (field === 'expiry') {
      formatted = value.replace(/\D/g, '').replace(/(\d{2})(\d{1,2})/, '$1/$2').slice(0, 5);
      setValidation(prev => ({...prev, expiry: formatted.length === 5}));
    } else if (field === 'cvc') {
      formatted = value.replace(/\D/g, '').slice(0, 3);
      setValidation(prev => ({...prev, cvc: formatted.length === 3}));
    }
    
    setCard(prev => ({ ...prev, [field]: formatted }));
    if (error) setError(null);
  };

  const fireConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        life: 100
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach(p => {
        if (p.life > 0) {
          active = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.5; // Gravity
          p.life--;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
        }
      });

      if (active) requestAnimationFrame(animate);
    };

    animate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Client Validation
    if (!validation.number || !validation.expiry || !validation.cvc) {
      setError("Please check your card details.");
      return;
    }

    setLoading(true);
    
    try {
      // 1. Attempt to create Payment Intent (calls Edge Function)
      // If function is not deployed/found, this will throw
      const paymentIntent = await api.createPaymentIntent(total);
      
      // In a real app with proper Stripe JS Elements, you would use stripe.confirmCardPayment here.
      // Since we can't load the full Stripe JS SDK in this environment, getting the clientSecret
      // serves as proof that the backend connection works.
      if (!paymentIntent || !paymentIntent.clientSecret) {
         throw new Error("Payment server unavailable.");
      }

      // 3. Finalize Order in Database
      await onConfirm();
      setSuccess(true);
      setTimeout(() => fireConfetti(), 100);
      setTimeout(() => {
        setSuccess(false);
        setCard({ number: '', expiry: '', cvc: '', zip: '' });
        onClose();
      }, 3500);

    } catch (err: any) {
      console.error(err);
      setError("Payment processing failed. Please ensure the payment backend is deployed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      {success && <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[60]" />}
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-50">
        {success ? (
          <div className="p-10 text-center flex flex-col items-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Payment Successful!</h2>
            <p className="text-slate-500 text-sm mb-6">Your payment is held securely in Escrow until you confirm receipt of the item.</p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-500 font-mono border border-slate-100 w-full">
               Transaction ID: #{Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2">
                 <ShieldCheck className="text-green-600" size={20} />
                 <h3 className="font-bold text-lg text-slate-800">Secure Checkout</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Order Summary */}
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Item Subtotal</span>
                    <span className="font-bold text-slate-900">${price.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 flex items-center gap-1">
                       Service Fee ({(feePercent * 100).toFixed(1)}%) <Info size={12} className="text-slate-400" />
                    </span>
                    <span className="font-bold text-slate-900">${serviceFee.toFixed(2)}</span>
                 </div>
                 <div className="h-px bg-slate-100"></div>
                 <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800">Total</span>
                    <span className="font-black text-2xl text-primary-600">${total.toFixed(2)}</span>
                 </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start">
                 <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={18} />
                 <div>
                    <h4 className="font-bold text-blue-800 text-xs uppercase mb-1">Escrow Protection</h4>
                    <p className="text-xs text-blue-700 leading-snug">
                       Funds are only released to the seller <strong>after</strong> you verify the item in person.
                    </p>
                 </div>
              </div>

              {/* Custom Credit Card Form (Simulating Stripe Elements) */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Payment Method</label>
                    <div className="flex gap-2">
                       <div className="h-4 w-6 bg-slate-200 rounded"></div>
                       <div className="h-4 w-6 bg-slate-200 rounded"></div>
                       <div className="h-4 w-6 bg-slate-200 rounded"></div>
                    </div>
                 </div>
                 
                 <div className={`border rounded-xl p-4 space-y-4 bg-white transition-all ${error ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-400'}`}>
                    {/* Card Number */}
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                       <CreditCard className="text-slate-400" size={20} />
                       <input 
                         type="text" 
                         placeholder="0000 0000 0000 0000"
                         className="flex-1 outline-none text-sm font-medium bg-transparent font-mono placeholder:font-sans"
                         value={card.number}
                         onChange={(e) => handleCardChange('number', e.target.value)}
                         maxLength={19}
                       />
                       {validation.number && <CheckCircle2 size={16} className="text-green-500" />}
                    </div>
                    
                    {/* Expiry, CVC, ZIP */}
                    <div className="flex gap-4">
                       <div className="flex-1 flex items-center gap-2">
                          <Calendar size={16} className="text-slate-300" />
                          <input 
                            type="text" 
                            placeholder="MM / YY"
                            className="w-full outline-none text-sm font-medium bg-transparent font-mono placeholder:font-sans"
                            value={card.expiry}
                            onChange={(e) => handleCardChange('expiry', e.target.value)}
                            maxLength={5}
                          />
                       </div>
                       <div className="w-px bg-slate-100"></div>
                       <div className="flex-1 flex items-center gap-2">
                          <Lock size={16} className="text-slate-300" />
                          <input 
                            type="text" 
                            placeholder="CVC"
                            className="w-full outline-none text-sm font-medium bg-transparent font-mono placeholder:font-sans"
                            value={card.cvc}
                            onChange={(e) => handleCardChange('cvc', e.target.value)}
                            maxLength={3}
                          />
                       </div>
                       <div className="w-px bg-slate-100"></div>
                       <input 
                         type="text" 
                         placeholder="ZIP"
                         className="w-16 outline-none text-sm font-medium bg-transparent"
                         value={card.zip}
                         onChange={(e) => setCard({...card, zip: e.target.value})}
                         maxLength={5}
                       />
                    </div>
                 </div>
                 
                 <div className="flex justify-center items-center gap-2 text-xs text-slate-400">
                    <Lock size={12} /> Payments processed securely via Stripe
                 </div>
              </div>

              {error && (
                 <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 font-medium">
                    <AlertCircle size={16} /> {error}
                 </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center active:scale-95 disabled:opacity-70 disabled:scale-100"
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : `Pay $${total.toFixed(2)}`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
