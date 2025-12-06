
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { X, Camera, Save, Loader2, Instagram, Linkedin, Globe } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdate: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'BASIC' | 'SOCIAL'>('BASIC');
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [socials, setSocials] = useState(user.socialLinks || { instagram: '', linkedin: '', website: '' });
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(user.avatar);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let avatarUrl = user.avatar;
      
      // Upload new avatar if selected
      if (avatarFile) {
         const publicUrl = await api.uploadImage(avatarFile);
         if (publicUrl) avatarUrl = publicUrl;
      }

      await api.updateProfile(user.id, {
        name,
        avatar: avatarUrl,
        bio,
        socialLinks: socials
      });
      
      onUpdate(); // Trigger refresh in parent
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800">Edit Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
           <button 
             onClick={() => setActiveTab('BASIC')} 
             className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'BASIC' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
             Basic Info
           </button>
           <button 
             onClick={() => setActiveTab('SOCIAL')} 
             className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'SOCIAL' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
             Social Links
           </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {activeTab === 'BASIC' && (
            <>
              {/* Avatar Upload */}
              <div className="flex flex-col items-center">
                 <div className="relative group cursor-pointer">
                    <img src={preview} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm" />
                    <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera className="text-white" size={24} />
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
                 <p className="text-xs text-slate-400 mt-2">Tap to change photo</p>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase ml-1">Full Name</label>
                 <input 
                   type="text" 
                   value={name}
                   onChange={(e) => setName(e.target.value)}
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase ml-1">Bio</label>
                 <textarea 
                   value={bio}
                   onChange={(e) => setBio(e.target.value)}
                   placeholder="Tell us about yourself..."
                   className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none"
                 />
              </div>

              <div className="space-y-2 opacity-50">
                 <label className="text-xs font-bold text-slate-400 uppercase ml-1">College (Locked)</label>
                 <input 
                   type="text" 
                   value={user.college}
                   disabled
                   className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                 />
              </div>
            </>
          )}

          {activeTab === 'SOCIAL' && (
            <div className="space-y-4">
               <div className="relative group">
                  <Instagram className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-pink-500" size={20} />
                  <input 
                    type="text" 
                    placeholder="Instagram Handle"
                    value={socials.instagram || ''}
                    onChange={(e) => setSocials({...socials, instagram: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
               </div>
               <div className="relative group">
                  <Linkedin className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-700" size={20} />
                  <input 
                    type="text" 
                    placeholder="LinkedIn URL"
                    value={socials.linkedin || ''}
                    onChange={(e) => setSocials({...socials, linkedin: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
               </div>
               <div className="relative group">
                  <Globe className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-600" size={20} />
                  <input 
                    type="text" 
                    placeholder="Personal Website"
                    value={socials.website || ''}
                    onChange={(e) => setSocials({...socials, website: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  />
               </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Save Changes <Save size={18} className="ml-2" /></>}
          </button>
        </form>
      </div>
    </div>
  );
};
