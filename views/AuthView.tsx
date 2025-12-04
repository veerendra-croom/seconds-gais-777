
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Key, ChevronLeft, Sparkles, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { College } from '../types';

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
  const [colleges, setColleges] = useState<College[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    college: '',
    adminCode: ''
  });

  useEffect(() => {
    api.getColleges().then(setColleges);
  }, []);

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
        if (role === 'ADMIN') {
          if (!formData.adminCode) throw new Error("Admin Access Code is required.");
          const isValid = await api.checkAdminCode(formData.adminCode);
          if (!isValid) throw new Error("Invalid Admin Access Code.");
        } else {
          // Student must select a college
          if (!formData.college) throw new Error("Please select your university.");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              college: formData.college || (role === 'ADMIN' ? 'Seconds HQ' : 'University'),
              role: role 
            },
          },
        });

        if (authError) throw authError;

        if (authData.user && !authData.session) {
          setMessage("Registration successful! Please check your email to verify your account.");
          return;
        }

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

  const handleForgotPassword = async () => {
    const email = prompt("Enter your email address to recover password:");
    if (email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) alert("Error: " + error.message);
      else alert("Password reset link sent to " + email);
    }
  };

  if (message) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background FX */}
        <div className="fixed inset-0 z-0 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/50 p-10 text-center animate-zoom-in relative z-10">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Check your inbox</h2>
          <p className="text-slate-500 mb-8 font-medium">{message}</p>
          <button 
            onClick={() => { setMessage(null); setIsLogin(true); }}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* --- PREMIUM BACKGROUND FX (Matches Landing) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <button 
        onClick={onBack}
        className="absolute top-8 left-8 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-sm text-slate-600 hover:text-slate-900 hover:bg-white transition-all z-20 hover:scale-110 active:scale-95"
      >
        <ChevronLeft size={24} />
      </button>

      <div className="w-full max-w-[420px] relative z-10 animate-slide-up">
        <div className="bg-white/70 backdrop-blur-xl rounded-[40px] shadow-2xl border border-white/50 overflow-hidden">
          
          {/* Header Area */}
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-900 rounded-xl text-white font-bold text-xl mb-6 shadow-lg shadow-slate-900/20">S</div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-slate-500 font-medium">
              {isLogin ? 'Enter your details to sign in.' : 'Join the verified student economy.'}
            </p>
          </div>

          {/* Toggle Login/Register */}
          <div className="px-8">
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl relative">
              <div 
                className={`absolute inset-y-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${isLogin ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}
              ></div>
              <button 
                onClick={() => { setIsLogin(true); setError(null); }}
                className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${isLogin ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setIsLogin(false); setError(null); }}
                className={`flex-1 py-3 text-sm font-bold relative z-10 transition-colors ${!isLogin ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Register
              </button>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50/80 backdrop-blur border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="flex gap-4">
                     <button
                       type="button"
                       onClick={() => setRole('STUDENT')}
                       className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${role === 'STUDENT' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                     >
                       I'm a Student
                     </button>
                     <button
                       type="button"
                       onClick={() => setRole('ADMIN')}
                       className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${role === 'ADMIN' ? 'border-slate-800 bg-slate-50 text-slate-900' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                     >
                       I'm an Admin
                     </button>
                  </div>

                  <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in">
                    <div className="relative group">
                      <User className="absolute left-4 top-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                      <input 
                        type="text" 
                        required
                        placeholder="Full Name"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                        value={formData.fullName}
                        onChange={e => setFormData({...formData, fullName: e.target.value})}
                      />
                    </div>
                    
                    {/* College Dropdown */}
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                      <select
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium appearance-none cursor-pointer"
                        value={formData.college}
                        onChange={e => setFormData({...formData, college: e.target.value})}
                      >
                        <option value="" disabled>Select College</option>
                        {colleges.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronLeft className="text-slate-400 -rotate-90" size={16} />
                      </div>
                    </div>
                  </div>

                  {role === 'ADMIN' && (
                    <div className="relative group animate-in slide-in-from-bottom-2 fade-in">
                      <Key className="absolute left-4 top-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                      <input 
                        type="text" 
                        required
                        placeholder="Admin Access Code"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all font-mono placeholder:font-sans placeholder:text-slate-400"
                        value={formData.adminCode}
                        onChange={e => setFormData({...formData, adminCode: e.target.value})}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                  <input 
                    type="email" 
                    required
                    placeholder={isLogin ? "Email Address" : "Personal Email"}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                  <input 
                    type="password" 
                    required
                    placeholder="Password"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center mt-6 text-white text-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:active:scale-100 ${role === 'ADMIN' && !isLogin ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/30' : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:to-primary-600 shadow-primary-500/30'}`}
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={20} className="ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Footer Links */}
        <div className="mt-8 text-center space-y-2">
           <button onClick={handleForgotPassword} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Forgot Password?</button>
           <div className="flex justify-center gap-4 text-xs text-slate-400">
              <a href="#" className="hover:text-slate-600">Privacy</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-600">Terms</a>
           </div>
        </div>
      </div>
    </div>
  );
};
