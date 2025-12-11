
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, UserPlus, MapPin, Phone, AlertTriangle, ChevronLeft, Plus, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { SafetyMap } from '../components/SafetyMap';
import { useToast } from '../components/Toast';
import { api } from '../services/api';

interface SafetyViewProps {
  user: UserProfile;
  onBack: () => void;
  onVerifyClick: () => void;
}

export const SafetyView: React.FC<SafetyViewProps> = ({ user: initialUser, onBack, onVerifyClick }) => {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<'TOOLS' | 'MAP' | 'CONTACTS'>('TOOLS');
  const [contacts, setContacts] = useState<string[]>(initialUser.trustedContacts || []);
  const [newContact, setNewContact] = useState('');
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Ensure we have latest data
    api.getProfile(initialUser.id).then(updated => {
      if (updated) {
        setUser(updated);
        setContacts(updated.trustedContacts || []);
      }
    });
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.includes('@')) {
      showToast("Please enter a valid email.", 'error');
      return;
    }
    if (contacts.includes(newContact)) {
      showToast("Contact already added.", 'error');
      return;
    }

    const updated = [...contacts, newContact];
    setContacts(updated);
    setNewContact('');
    
    try {
      await api.updateTrustedContacts(user.id, updated);
      showToast("Trusted contact saved.", 'success');
    } catch (e) {
      console.error(e);
      showToast("Failed to save contact.", 'error');
    }
  };

  const handleRemoveContact = async (email: string) => {
    if (!confirm("Remove this trusted contact?")) return;
    const updated = contacts.filter(c => c !== email);
    setContacts(updated);
    
    try {
      await api.updateTrustedContacts(user.id, updated);
      showToast("Contact removed", 'info');
    } catch (e) {
      showToast("Failed to update contacts.", 'error');
    }
  };

  const handleSOS = async () => {
    if (contacts.length === 0) {
      showToast("Add trusted contacts first!", 'error');
      setActiveTab('CONTACTS');
      return;
    }

    if (confirm("Send emergency alert to your trusted contacts?")) {
      setLoading(true);
      try {
        // Send email to all contacts concurrently
        const promises = contacts.map(email => 
           api.invokeFunction('send-email', {
             email,
             type: 'ALERT',
             message: `🚨 SOS ALERT: ${user.name} has triggered an emergency alert from the Seconds App. Please contact them or campus security immediately.`
           })
        );
        await Promise.all(promises);
        showToast("🚨 SOS Alerts Sent!", 'success');
      } catch (e) {
        console.error(e);
        showToast("Failed to send alerts.", 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleLocationShare = () => {
    setIsSharingLocation(!isSharingLocation);
    showToast(isSharingLocation ? "Location sharing stopped." : "Location shared with trusted contacts.", 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Safety Center</h1>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Verification Status Card */}
        <div className={`p-6 rounded-2xl border ${user.verified ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'} flex items-center justify-between`}>
           <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.verified ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                 <ShieldCheck size={24} />
              </div>
              <div>
                 <h3 className={`font-bold ${user.verified ? 'text-green-900' : 'text-amber-900'}`}>
                    {user.verified ? 'Identity Verified' : 'Action Required'}
                 </h3>
                 <p className={`text-xs ${user.verified ? 'text-green-700' : 'text-amber-700'}`}>
                    {user.verified ? 'Your student status is confirmed.' : 'Verify your ID to trade safely.'}
                 </p>
              </div>
           </div>
           {!user.verified && (
              <button 
                onClick={onVerifyClick}
                className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all"
              >
                 Verify Now
              </button>
           )}
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-100">
           <button 
             onClick={() => setActiveTab('TOOLS')}
             className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'TOOLS' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Emergency Tools
           </button>
           <button 
             onClick={() => setActiveTab('MAP')}
             className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'MAP' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Safe Zones
           </button>
           <button 
             onClick={() => setActiveTab('CONTACTS')}
             className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'CONTACTS' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Trusted Contacts
           </button>
        </div>

        {/* Content */}
        {activeTab === 'TOOLS' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
              <button 
                onClick={handleSOS}
                disabled={loading}
                className="bg-red-500 text-white p-6 rounded-2xl shadow-xl shadow-red-500/30 flex flex-col items-center text-center gap-3 hover:bg-red-600 transition-all active:scale-95 group disabled:opacity-50"
              >
                 <div className={`w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${loading ? 'animate-pulse' : ''}`}>
                    <AlertTriangle size={32} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black">{loading ? 'Sending...' : 'SOS Alert'}</h3>
                    <p className="text-red-100 text-xs">Notify contacts & security instantly</p>
                 </div>
              </button>

              <button 
                onClick={toggleLocationShare}
                className={`p-6 rounded-2xl shadow-lg border flex flex-col items-center text-center gap-3 transition-all active:scale-95 group ${isSharingLocation ? 'bg-blue-500 text-white border-blue-500 shadow-blue-500/30' : 'bg-white text-slate-800 border-slate-200'}`}
              >
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${isSharingLocation ? 'bg-white/20' : 'bg-blue-50 text-blue-500'}`}>
                    <MapPin size={32} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold">{isSharingLocation ? 'Sharing Live' : 'Share Location'}</h3>
                    <p className={`text-xs ${isSharingLocation ? 'text-blue-100' : 'text-slate-400'}`}>
                       {isSharingLocation ? 'Tracking active. Tap to stop.' : 'Share with trusted contacts.'}
                    </p>
                 </div>
              </button>

              <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                    <Phone size={24} />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-slate-800">Campus Security</h3>
                    <p className="text-xs text-slate-500">24/7 Emergency Line: (555) 123-4567</p>
                 </div>
                 <a href="tel:5551234567" className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200 block text-center">
                    Call Now
                 </a>
              </div>
           </div>
        )}

        {activeTab === 'MAP' && (
           <div className="animate-slide-up space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                 <ShieldCheck className="text-blue-600 shrink-0 mt-0.5" size={20} />
                 <p className="text-sm text-blue-800">
                    <strong>Pro Tip:</strong> Always meet in designated Safe Zones like libraries or student unions. These areas are well-lit and have security presence.
                 </p>
              </div>
              <div className="h-[400px] rounded-2xl overflow-hidden shadow-md border border-slate-200">
                 <SafetyMap collegeName={user.college} />
              </div>
           </div>
        )}

        {activeTab === 'CONTACTS' && (
           <div className="space-y-6 animate-slide-up">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-primary-500" /> Add Trusted Contact
                 </h3>
                 <form onSubmit={handleAddContact} className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="Friend's Email Address"
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      value={newContact}
                      onChange={(e) => setNewContact(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 transition-colors"
                    >
                       <Plus size={20} />
                    </button>
                 </form>
              </div>

              <div className="space-y-3">
                 {contacts.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                       No trusted contacts added yet.
                    </div>
                 ) : contacts.map((email, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                             {email[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-700 text-sm">{email}</span>
                       </div>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => handleRemoveContact(email)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

      </div>
    </div>
  );
};
