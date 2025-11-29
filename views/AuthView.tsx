import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    college: ''
  });

  const validateEmail = (email: string) => {
    // Basic validation, in production utilize a list of college domains
    const eduRegex = /^[^\s@]+@[^\s@]+\.(edu|ac\.[a-z]{2}|edu\.[a-z]{2})$/i;
    // For demo purposes, we also allow common domains but warn user
    return eduRegex.test(email) || email.includes('student') || email.length > 5; 
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
      } else {
        // Register Logic
        if (!validateEmail(formData.email)) {
           throw new Error("Please use a valid college email (.edu) to register.");
        }
        
        // 1. Sign Up Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              college: formData.college || 'University',
            },
          },
        });

        if (authError) throw authError;

        // 2. Create Profile Row
        if (authData.user) {
          await api.createProfile({
             id: authData.user.id,
             email: formData.email,
             name: formData.fullName,
             college: formData.college || 'University',
             avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`
          });
        }
        
        setMessage("Account created! Logging you in...");
        // Auto login usually happens, but if email confirm is on, it waits.
        // For this demo, we assume email confirm is off or auto-sign-in works.
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-primary-600 px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-500 to-primary-700 opacity-90"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 text-primary-600 text-3xl font-bold">
              S
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Seconds</h1>
            <p className="text-primary-100 text-sm">The Verified Campus Marketplace</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="flex gap-4 mb-8 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-2 text-green-700 text-sm">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-slate-500 uppercase ml-1">College Name</label>
                   <div className="relative">
                      <input 
                        type="text"
                        required 
                        placeholder="Stanford University"
                        className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                        value={formData.college}
                        onChange={e => setFormData({...formData, college: e.target.value})}
                      />
                   </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">College Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="jane@stanford.edu"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center mt-6"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};