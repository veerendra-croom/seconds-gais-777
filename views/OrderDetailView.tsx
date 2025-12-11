import React, { useState, useEffect } from 'react';
import { Transaction, Booking, UserProfile } from '../types';
import { ChevronLeft, MapPin, MessageCircle, CheckCircle2, AlertTriangle, ShieldCheck, Clock, Copy, Navigation, HelpCircle, ScanLine, XCircle, Star } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { SafetyMap } from '../components/SafetyMap';
import { ReviewModal } from '../components/ReviewModal';

interface OrderDetailViewProps {
  order: Transaction | Booking | any;
  type: 'PURCHASE' | 'SALE' | 'BOOKING' | 'OFFER';
  user: UserProfile;
  onBack: () => void;
  onChat: (partnerId: string) => void;
  onScan?: (expectedCode: string, orderId: string) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ order, type, user, onBack, onChat, onScan }) => {
  const { showToast } = useToast();
  const [status, setStatus] = useState(order.status);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  
  // Identify role
  const isBuyer = type === 'PURCHASE' || (type === 'BOOKING' && order.booker_id === user.id);
  const partner = isBuyer ? (order.seller || order.provider) : (order.buyer || order.booker);
  const item = order.item || order.service || order.targetItem;
  
  // Mock Meetup Code (In real app, this comes from DB)
  const meetupCode = order.meetupCode || Math.floor(100000 + Math.random() * 900000).toString();

  useEffect(() => {
    checkReviewStatus();
    
    // Subscribe to realtime updates
    const subscription = api.subscribeToOrder(
      order.id, 
      type === 'BOOKING' ? 'BOOKING' : 'TRANSACTION', 
      (updatedOrder) => {
         if (updatedOrder && updatedOrder.status !== status) {
            setStatus(updatedOrder.status);
            showToast(`Order status updated: ${updatedOrder.status}`, 'info');
            if (updatedOrder.status === 'COMPLETED') {
               setShowReviewModal(true);
            }
         }
      }
    );

    return () => { subscription.unsubscribe(); };
  }, [order.id, status]);

  const checkReviewStatus = async () => {
    if (status === 'COMPLETED') {
      const reviewed = await api.hasUserReviewedOrder(order.id, user.id);
      setHasReviewed(reviewed);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(meetupCode);
    showToast("Meetup code copied!", 'success');
  };

  const handleAction = async (action: string) => {
    if (!window.confirm(`Are you sure you want to ${action.toLowerCase().replace('_', ' ')}?`)) return;
    
    try {
      if (action === 'CONFIRM_RECEIPT') {
         await api.confirmOrder(order.id, user.id);
         setStatus('COMPLETED');
         showToast("Order completed! Funds released.", 'success');
         // Auto open review modal
         setShowReviewModal(true);
      } else if (action === 'CANCEL') {
         setStatus('CANCELLED');
         showToast("Order cancelled.", 'info');
      }
    } catch (e) {
      showToast("Action failed. Please try again.", 'error');
    }
  };

  const steps = [
    { label: 'Ordered', done: true, date: new Date(order.createdAt || order.booking_date).toLocaleDateString() },
    { label: 'Accepted', done: status !== 'PENDING' && status !== 'REQUESTED', date: '---' },
    { label: 'Met Up', done: status === 'COMPLETED', date: '---' },
    { label: 'Completed', done: status === 'COMPLETED', date: '---' }
  ];

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-100 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="font-bold text-lg text-slate-800">Order Details</h1>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : status === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
           {status}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Item Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4">
           <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
              {item?.image && <img src={JSON.parse(item.image)[0] || item.image} className="w-full h-full object-cover" />}
           </div>
           <div className="flex-1">
              <h3 className="font-bold text-slate-900">{item?.title}</h3>
              <p className="text-sm text-slate-500 mb-2">Order #{order.id.slice(0,8).toUpperCase()}</p>
              <div className="flex items-center gap-2">
                 <span className="font-bold text-primary-600">${order.amount || item?.price}</span>
                 {item?.type === 'RENT' && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Rental</span>}
              </div>
           </div>
        </div>

        {/* Review Prompt (if Completed and Not Reviewed) */}
        {status === 'COMPLETED' && !hasReviewed && (
           <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-6 rounded-2xl border border-amber-200 flex flex-col items-center text-center animate-slide-up">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-amber-500">
                 <Star size={24} fill="currentColor" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">How was it?</h3>
              <p className="text-slate-600 text-sm mb-4">Help the community by rating your experience with {partner?.full_name}.</p>
              <button 
                onClick={() => setShowReviewModal(true)}
                className="bg-white text-slate-800 px-6 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                 Rate Experience
              </button>
           </div>
        )}

        {/* Timeline */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-6 text-sm uppercase tracking-wider">Timeline</h3>
           <div className="relative flex justify-between items-start">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-slate-100 -z-10"></div>
              {steps.map((step, i) => (
                 <div key={i} className="flex flex-col items-center gap-2 bg-white px-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${step.done ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                       <CheckCircle2 size={14} />
                    </div>
                    <div className="text-center">
                       <p className={`text-xs font-bold ${step.done ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</p>
                       <p className="text-[10px] text-slate-400">{step.date}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>

        {/* --- DYNAMIC ACTION AREA --- */}
        {status !== 'COMPLETED' && status !== 'CANCELLED' && (
          isBuyer ? (
            // Buyer View: Show QR Code
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               
               <div className="relative z-10 flex flex-col items-center text-center">
                  <h3 className="font-bold text-xl flex items-center gap-2 mb-2"><ShieldCheck size={24}/> Meetup Pass</h3>
                  <p className="text-indigo-200 text-sm mb-6 max-w-xs">Show this QR code to {partner?.full_name} when you meet to verify the handover.</p>
                  
                  <div className="bg-white p-3 rounded-2xl shadow-lg mb-6">
                     <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${meetupCode}&color=0f172a`} alt="Meetup QR" className="w-40 h-40" />
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-3 backdrop-blur-md">
                     <div className="text-left">
                        <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Backup Code</p>
                        <p className="text-2xl font-mono font-black tracking-widest">{meetupCode}</p>
                     </div>
                     <button onClick={handleCopyCode} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Copy size={20} />
                     </button>
                  </div>
               </div>
            </div>
          ) : (
            // Seller View: Scan Button
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <ScanLine size={32} />
               </div>
               <h3 className="font-bold text-lg text-slate-800 mb-2">Verify Handover</h3>
               <p className="text-slate-500 text-sm mb-6">
                  Meet with {partner?.full_name} and scan their QR code to confirm you have delivered the item.
               </p>
               <button 
                 onClick={() => onScan && onScan(meetupCode, order.id)}
                 className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95"
               >
                  <ScanLine size={20} /> Scan Buyer's Code
               </button>
            </div>
          )
        )}

        {/* Partner Info */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <img src={partner?.avatar_url || `https://ui-avatars.com/api/?name=${partner?.full_name || 'User'}`} className="w-12 h-12 rounded-full bg-slate-100" />
              <div>
                 <p className="text-xs text-slate-500 font-bold uppercase">{isBuyer ? 'Seller' : 'Buyer'}</p>
                 <p className="font-bold text-slate-800">{partner?.full_name || 'Trading Partner'}</p>
              </div>
           </div>
           <button 
             onClick={() => onChat(partner?.id || '')}
             className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
           >
              <MessageCircle size={20} />
           </button>
        </div>

        {/* Danger Zone / Secondary Actions */}
        {status !== 'COMPLETED' && status !== 'CANCELLED' && (
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleAction('CANCEL')}
                className="py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
              >
                 Cancel Order
              </button>
              <button className="py-3 bg-white border border-slate-200 text-red-600 rounded-xl font-bold hover:bg-red-50 flex items-center justify-center gap-2">
                 <AlertTriangle size={18} /> Report Issue
              </button>
           </div>
        )}

        {/* Safety Map */}
        <div className="pt-4">
           <h3 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2">
              <Navigation size={16} className="text-primary-500"/> Recommended Meetup Zone
           </h3>
           <SafetyMap collegeName={user.college} />
        </div>

      </div>

      <ReviewModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        targetUserId={partner?.id || ''}
        targetUserName={partner?.full_name || 'Partner'}
        currentUserId={user.id}
        orderId={order.id}
        onReviewSubmitted={() => setHasReviewed(true)}
      />
    </div>
  );
};