
import React, { useState } from 'react';
import { ChevronLeft, Smartphone, Globe, Shield, LogOut, CheckCircle2, QrCode, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/Toast';

interface SecuritySettingsViewProps {
  onBack: () => void;
}

// Mock active sessions (In prod, fetch from supabase.auth.admin.listUserFactors or custom edge function)
const MOCK_SESSIONS = [
  { id: '1', device: 'iPhone 13 Pro', os: 'iOS 16.0', location: 'Los Angeles, USA', ip: '192.168.1.1', lastActive: 'Now', current: true },
  { id: '2', device: 'MacBook Pro', os: 'macOS Ventura', location: 'San Diego, USA', ip: '47.12.98.22', lastActive: '2 days ago', current: false },
  { id: '3', device: 'Chrome Browser', os: 'Windows 11', location: 'New York, USA', ip: '104.22.11.00', lastActive: '1 week ago', current: false },
];

export const SecuritySettingsView: React.FC<SecuritySettingsViewProps> = ({ onBack }) => {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleRevokeSession = (id: string) => {
    if (confirm("Are you sure you want to log out this device?")) {
      setSessions(prev => prev.filter(s => s.id !== id));
      showToast("Session revoked successfully.", 'success');
    }
  };

  const handleRevokeAll = () => {
    if (confirm("Log out of all other devices?")) {
      setSessions(prev => prev.filter(s => s.current));
      showToast("All other sessions revoked.", 'success');
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API verification
    setTimeout(() => {
      setLoading(false);
      if (totpCode === '123456') { // Mock check
        setIs2FAEnabled(true);
        setShow2FASetup(false);
        showToast("Two-Factor Authentication Enabled!", 'success');
      } else {
        showToast("Invalid code. Try again.", 'error');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Login & Security</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* 2FA Section */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
           <div className="flex items-start gap-4 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${is2FAEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                 <Shield size={24} />
              </div>
              <div className="flex-1">
                 <h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h2>
                 <p className="text-slate-500 text-sm mt-1">Add an extra layer of security to your account by requiring a code when signing in.</p>
              </div>
              {is2FAEnabled && <CheckCircle2 className="text-green-500 mt-1" size={24} />}
           </div>

           {!is2FAEnabled && !show2FASetup && (
              <button 
                onClick={() => setShow2FASetup(true)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Enable 2FA
              </button>
           )}

           {show2FASetup && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 animate-slide-up">
                 <div className="flex flex-col items-center text-center mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-slate-100">
                       <QrCode size={120} />
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">Scan this QR Code</p>
                    <p className="text-xs text-slate-500 max-w-xs">Use an authenticator app like Google Authenticator or Authy.</p>
                 </div>

                 <form onSubmit={handleVerify2FA} className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400 uppercase ml-1">Enter 6-digit Code</label>
                       <input 
                         type="text" 
                         maxLength={6}
                         placeholder="000 000"
                         className="w-full p-4 text-center text-2xl font-mono tracking-widest bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                         value={totpCode}
                         onChange={(e) => setTotpCode(e.target.value.replace(/\D/g,''))}
                       />
                    </div>
                    <div className="flex gap-3">
                       <button 
                         type="button"
                         onClick={() => setShow2FASetup(false)}
                         className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                       >
                         Cancel
                       </button>
                       <button 
                         type="submit"
                         disabled={loading || totpCode.length !== 6}
                         className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {loading && <Loader2 className="animate-spin" size={18} />} Verify
                       </button>
                    </div>
                 </form>
              </div>
           )}

           {is2FAEnabled && (
              <button 
                onClick={() => { setIs2FAEnabled(false); showToast("2FA Disabled", 'info'); }}
                className="text-red-500 text-sm font-bold hover:underline"
              >
                 Disable 2FA
              </button>
           )}
        </div>

        {/* Active Sessions */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider">Active Devices</h3>
              <button onClick={handleRevokeAll} className="text-xs font-bold text-red-500 hover:text-red-600">Sign out all devices</button>
           </div>

           <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {sessions.map(session => (
                 <div key={session.id} className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                       {session.device.toLowerCase().includes('phone') ? <Smartphone size={20} /> : <Globe size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 text-sm truncate">{session.device}</p>
                          {session.current && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Current</span>}
                       </div>
                       <p className="text-xs text-slate-500">{session.os} • {session.location}</p>
                       <p className="text-[10px] text-slate-400 mt-0.5">Last active: {session.lastActive}</p>
                    </div>
                    {!session.current && (
                       <button onClick={() => handleRevokeSession(session.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Revoke Access">
                          <LogOut size={18} />
                       </button>
                    )}
                 </div>
              ))}
           </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
           <AlertTriangle className="text-amber-600 shrink-0" size={20} />
           <div>
              <h4 className="font-bold text-amber-900 text-sm">Security Tip</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                 If you see a device you don't recognize, log it out immediately and change your password.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
};
