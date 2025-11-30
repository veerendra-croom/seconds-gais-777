
import React, { useState } from 'react';
import { Loader2, GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface CollegeLinkViewProps {
  userId: string;
  onSuccess: () => void;
}

export const CollegeLinkView: React.FC<CollegeLinkViewProps> = ({ userId, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic .edu validation
    const eduRegex = /^[^\s@]+@[^\s@]+\.(edu|ac\.[a-z]{2}|edu\.[a-z]{2})$/i;
    if (!eduRegex.test(email) && !email.includes('student')) {
      setLoading(false);
      setError("Please enter a valid .edu student email address.");
      return;
    }

    try {
      await api.linkCollegeEmail(userId, email);
      // In a real app, we show a "Check your email" screen. 
      // Here we assume auto-verify for the demo flow.
      setTimeout(() => onSuccess(), 1000);
    } catch (err: any) {
      setError("Failed to link email. It might be in use.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 animate-fade-in text-center">
        <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Student Verification</h1>
        <p className="text-slate-500 mb-8">
          To access the campus marketplace, please link your official college email address (ending in .edu).
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="text-xs font-bold text-slate-400 uppercase ml-1">College Email</label>
            <input 
              type="email"
              placeholder="jane.doe@university.edu"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              <>
                Verify Status <ArrowRight size={20} className="ml-2" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
