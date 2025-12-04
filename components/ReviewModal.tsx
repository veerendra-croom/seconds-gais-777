
import React, { useState } from 'react';
import { X, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  currentUserId: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, targetUserId, targetUserName, currentUserId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createReview({
        reviewerId: currentUserId,
        targetUserId: targetUserId,
        rating,
        comment
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setComment('');
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
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Review Submitted!</h2>
            <p className="text-slate-500">Thanks for helping the community.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Rate {targetUserName}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      size={32} 
                      className={star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-slate-500 font-medium">
                {rating === 5 ? "Excellent!" : rating === 4 ? "Good" : rating === 3 ? "Average" : rating === 2 ? "Poor" : "Terrible"}
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Comment</label>
                <textarea 
                  required
                  placeholder="How was your experience trading with this student?"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none h-32"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" /> : `Submit Review`}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
