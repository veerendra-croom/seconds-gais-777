
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Key, ChevronLeft } from 'lucide-react';
import { api } from '../services/api';

interface AuthViewProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBack }) => {
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    college: '',
    adminCode: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        // App.tsx will detect session change and load user
      } else {
        // --- REGISTRATION FLOW ---
        
        // 1. Validate Admin Code if Admin
        if (role === 'ADMIN') {
          if (!formData.adminCode) throw new Error("Admin Access Code is required.");
          const isValid = await api.checkAdminCode(formData.adminCode);
          if (!isValid) throw new Error("Invalid Admin Access Code.");
        }

        // 2. Sign Up Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              college: formData.college || 'University',
              role: role 
            },
          },
        });

        if (authError) throw authError;

        // 3. Handle Session State
        if (authData.user && !authData.session) {
          // Email confirmation is required and pending
          setMessage("Registration successful! Please check your email to verify your account.");
          return; // Stop here, don't try to create profile yet (RLS will fail)
        }

        // 4. Create Profile Row (Only if session exists immediately, i.e., email confirm disabled)
        if (authData.user && authData.session) {
          await api.createProfile({
             id: authData.user.id,
             email: formData.email,
             name: formData.fullName,
             college: formData.college || (role === 'ADMIN' ? 'Seconds HQ' : 'University'),
             role: role,
             avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.fullName)}&background=random`
          });
          onSuccess();
        }
      }
      
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // If we have a success message (like "Check Email"), show that state
  if (message) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Check your inbox</h2>
          <p className="text-slate-500 mb-6">{message}</p>
          <button 
            onClick={() => { setMessage(null); setIsLogin(true); }}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm text-slate-500 hover:text-slate-900 transition-colors z-10"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-slate-900 px-8 py-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 opacity-90"></div>
          
          <div className="relative z-10">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-slate-300 text-sm">Sign in to continue to Seconds</p>
          </div>
        </div>

        {/* Role Toggle */}
        {!isLogin && (
          <div className="px-8 pt-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setRole('STUDENT')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${role === 'STUDENT' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-400'}`}
              >
                Student
              </button>
              <button 
                onClick={() => setRole('ADMIN')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${role === 'ADMIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-8 pt-6">
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`text-lg font-bold pb-1 transition-all ${isLogin ? 'text-slate-900 border-b-2 border-primary-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`text-lg font-bold pb-1 transition-all ${!isLogin ? 'text-slate-900 border-b-2 border-primary-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                      value={formData.fullName}
                      onChange={e => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">College</label>
                    <input 
                      type="text"
                      required 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                      value={formData.college}
                      onChange={e => setFormData({...formData, college: e.target.value})}
                    />
                  </div>
                </div>

                {role === 'ADMIN' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-bold text-slate-900 uppercase ml-1 flex items-center gap-1">
                      <Key size={12} /> Admin Code
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="Enter secret code"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all font-mono"
                      value={formData.adminCode}
                      onChange={e => setFormData({...formData, adminCode: e.target.value})}
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Email {isLogin ? '' : '(Personal)'}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="you@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Password</label>
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
              className={`w-full py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center mt-6 text-white ${role === 'ADMIN' && !isLogin ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-300' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-200'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {isLogin ? 'Sign In' : `Register as ${role === 'ADMIN' ? 'Admin' : 'Student'}`}
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
