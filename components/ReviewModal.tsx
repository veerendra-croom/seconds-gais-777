import React, { useState } from 'react';
import { X, Star, Loader2, CheckCircle2, ThumbsUp } from 'lucide-react';
import { api } from '../services/api';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  currentUserId: string;
  orderId?: string;
  onReviewSubmitted?: () => void;
}

const TAGS = [
  "Fast Responder", "Punctual", "Item as Described", "Friendly", "Easy to Find", "Flexible", "Patient"
];

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, targetUserId, targetUserName, currentUserId, orderId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
    } else {
      if (selectedTags.length < 3) {
        setSelectedTags(prev => [...prev, tag]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createReview({
        reviewerId: currentUserId,
        targetUserId: targetUserId,
        orderId: orderId,
        rating,
        comment,
        tags: selectedTags
      });
      setSuccess(true);
      if (onReviewSubmitted) onReviewSubmitted();
      setTimeout(() => {
        setSuccess(false);
        setComment('');
        setSelectedTags([]);
        onClose();
      }, 2000);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        {success ? (
          <div className="p-12 text-center flex flex-col items-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Review Submitted!</h2>
            <p className="text-slate-500 font-medium">Thank you for building trust in the community.</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Rate {targetUserName}</h3>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-2">
                <div className="flex space-x-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star 
                        size={36} 
                        className={`transition-colors ${star <= rating ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "text-slate-200"}`} 
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {rating === 5 ? "Excellent!" : rating === 4 ? "Good" : rating === 3 ? "Okay" : rating === 2 ? "Poor" : "Terrible"}
                </p>
              </div>

              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                    <ThumbsUp size={12} /> Compliments (Select up to 3)
                 </p>
                 <div className="flex flex-wrap gap-2">
                    {TAGS.map(tag => (
                       <button
                         key={tag}
                         type="button"
                         onClick={() => toggleTag(tag)}
                         className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                           selectedTags.includes(tag) 
                             ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                             : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                         }`}
                       >
                         {tag}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Comment (Optional)</label>
                <textarea 
                  placeholder="How was your experience trading with this student?"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none resize-none h-28 text-sm"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center active:scale-95"
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