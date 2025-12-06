
import React, { useState } from 'react';
import { Loader2, GraduationCap, CheckCircle2, ArrowRight, LogOut, Mail } from 'lucide-react';
import { api } from '../services/api';
import { signOut } from '../services/supabaseClient';
import { useToast } from '../components/Toast';

interface CollegeLinkViewProps {
  userId: string;
  onSuccess: () => void;
}

export const CollegeLinkView: React.FC<CollegeLinkViewProps> = ({ userId, onSuccess }) => {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const eduRegex = /^[^\s@]+@[^\s@]+\.(edu|ac\.[a-z]{2}|edu\.[a-z]{2})$/i;
    if (!eduRegex.test(email) && !email.includes('student')) {
      setLoading(false);
      setError("Please enter a valid .edu student email address.");
      return;
    }

    try {
      const code = await api.sendCollegeVerification(email);
      setStep('OTP');
      // DEMO FEATURE: Show code in Toast
      showToast(`Demo Code: ${code}`, 'success', 10000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.verifyCollegeEmail(userId, email, otp);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <button 
        onClick={signOut}
        className="absolute top-4 right-4 flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors text-sm font-bold"
      >
        <LogOut size={16} /> Sign Out
      </button>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 animate-fade-in text-center">
        <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap size={40} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Student Verification</h1>
        <p className="text-slate-500 mb-8">
          To access the campus marketplace, please link your official college email address.
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {step === 'EMAIL' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">College Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                  type="email"
                  placeholder="jane.doe@university.edu"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  Send Code <ArrowRight size={20} className="ml-2" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4 animate-slide-up">
            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-4">
               A verification code has been sent to <strong>{email}</strong>. Check your inbox (or toast message).
            </div>
            
            <div className="text-left">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Verification Code</label>
              <input 
                type="text"
                placeholder="123456"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all text-center tracking-widest text-lg font-mono"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  Verify & Enter <CheckCircle2 size={20} className="ml-2" />
                </>
              )}
            </button>
            
            <button type="button" onClick={() => setStep('EMAIL')} className="text-xs text-slate-400 font-bold hover:text-slate-600">
               Use different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
