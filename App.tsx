
import React, { useState, useEffect } from 'react';
import { supabase, signOut } from './services/supabaseClient';
import { api } from './services/api';
import { Navigation } from './components/Navigation';
import { Home } from './views/Home';
import { Marketplace } from './views/Marketplace';
import { SellItem } from './views/SellItem';
import { ProfileView } from './views/ProfileView';
import { AuthView } from './views/AuthView';
import { VerificationView } from './views/VerificationView';
import { ItemDetailView } from './views/ItemDetailView';
import { ChatListView } from './views/ChatListView';
import { ChatView } from './views/ChatView';
import { LandingView } from './views/LandingView';
import { CollegeLinkView } from './views/CollegeLinkView';
import { AdminDashboard } from './views/AdminDashboard';
import { ModuleType, UserProfile, Item, Conversation } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [appState, setAppState] = useState<'LOADING' | 'LANDING' | 'AUTH' | 'COLLEGE_LINK' | 'VERIFICATION' | 'APP' | 'ADMIN_DASHBOARD'>('LOADING');
  const [currentView, setCurrentView] = useState<ModuleType>('HOME');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Navigation State
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        handleUserLoaded(session.user.id);
      } else {
        setAppState('LANDING'); // Default to Landing Page if no session
      }
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        handleUserLoaded(session.user.id);
      } else {
        setAppState('LANDING');
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserLoaded = async (userId: string) => {
    try {
      let profile = await api.getProfile(userId);
      
      // --- LAZY PROFILE CREATION ---
      // If user exists in Auth but not in Profiles table (e.g. after email confirmation)
      if (!profile) {
        console.log("Profile missing, attempting lazy creation...");
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && user.user_metadata) {
          try {
            await api.createProfile({
              id: user.id,
              email: user.email!,
              name: user.user_metadata.full_name || 'Student',
              college: user.user_metadata.college || 'University',
              role: user.user_metadata.role || 'STUDENT',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata.full_name || 'User')}&background=random`
            });
            // Retry fetching profile
            profile = await api.getProfile(userId);
          } catch (createError) {
            console.error("Lazy creation failed", createError);
          }
        }
      }

      if (profile) {
        setUserProfile(profile);

        // --- ROLE BASED ROUTING ---
        if (profile.role === 'ADMIN') {
          setAppState('ADMIN_DASHBOARD');
          return;
        }

        // --- STUDENT VERIFICATION FLOW ---
        // 1. Check College Email Link
        if (!profile.collegeEmailVerified) {
          setAppState('COLLEGE_LINK');
          return;
        }

        // 2. Check ID Verification
        const hasSkipped = localStorage.getItem('skipped_verification');
        if (profile.verified || profile.verificationStatus === 'VERIFIED' || hasSkipped) {
          setAppState('APP');
        } else {
          setAppState('VERIFICATION');
        }
      } else {
        // If still no profile, something is wrong with DB permissions or connection
        console.error("Critical: User authenticated but profile creation failed.");
        setAppState('AUTH'); // Go back to auth to try again or show error
        // Optionally signOut() here, but keeping them logged in allows retry
      }
    } catch (error) {
      console.error("Error loading user", error);
      setAppState('AUTH');
    }
  };

  const handleCollegeLinkSuccess = () => {
    // Re-fetch profile to update state
    if (session?.user?.id) handleUserLoaded(session.user.id);
  };

  const handleVerificationComplete = () => {
    localStorage.setItem('skipped_verification', 'true');
    setAppState('APP');
    if (session?.user?.id) handleUserLoaded(session.user.id);
  };

  // ... (View Handlers same as before)
  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setCurrentView('SELL');
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setCurrentView('ITEM_DETAIL');
  };

  const handleSellBack = () => {
    setEditingItem(null); 
    setCurrentView('HOME');
  };

  const handleStartChat = (item: Item) => {
    setSelectedItem(item);
    setActiveConversation(null); 
    setCurrentView('CHAT_ROOM');
  };

  const handleSelectChat = (conv: Conversation) => {
    setActiveConversation(conv);
    setSelectedItem(null); 
    setCurrentView('CHAT_ROOM');
  };

  const handleViewChange = (view: ModuleType) => {
    if (currentView === 'SELL' && view !== 'SELL') setEditingItem(null);
    if (view === 'CHAT_LIST') setActiveConversation(null);
    setCurrentView(view);
  }

  const renderView = () => {
    if (!userProfile) return null;

    switch (currentView) {
      case 'HOME': return <Home user={userProfile} onModuleSelect={setCurrentView} onItemClick={handleItemClick} />;
      case 'SELL': return <SellItem user={userProfile} onBack={handleSellBack} itemToEdit={editingItem} />;
      case 'PROFILE': return <ProfileView user={userProfile} onEditItem={handleEditItem} />;
      case 'ITEM_DETAIL': 
        if (!selectedItem) return <Home user={userProfile} onModuleSelect={setCurrentView} onItemClick={handleItemClick} />;
        return <ItemDetailView item={selectedItem} currentUser={userProfile} onBack={() => setCurrentView('HOME')} onChat={handleStartChat} />;
      case 'CHAT_LIST': return <ChatListView user={userProfile} onSelectChat={handleSelectChat} onBack={() => setCurrentView('HOME')} />;
      case 'CHAT_ROOM': return <ChatView currentUser={userProfile} activeConversation={activeConversation} targetItem={selectedItem || undefined} onBack={() => setCurrentView('CHAT_LIST')} />;
      case 'BUY':
      case 'RENT':
      case 'SHARE':
      case 'SWAP':
      case 'EARN':
      case 'REQUEST':
        return <Marketplace type={currentView} onBack={() => setCurrentView('HOME')} onItemClick={handleItemClick} />;
      default: return <Home user={userProfile} onModuleSelect={setCurrentView} onItemClick={handleItemClick} />;
    }
  };

  // --- STATE ROUTING ---

  if (appState === 'LOADING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  if (appState === 'LANDING') {
    return <LandingView onGetStarted={() => setAppState('AUTH')} />;
  }

  if (appState === 'AUTH') {
    return <AuthView onSuccess={() => {}} onBack={() => setAppState('LANDING')} />; 
  }

  if (appState === 'COLLEGE_LINK') {
    return <CollegeLinkView userId={session?.user?.id} onSuccess={handleCollegeLinkSuccess} />;
  }

  if (appState === 'VERIFICATION') {
    return <VerificationView userId={session?.user?.id} onVerificationComplete={handleVerificationComplete} />;
  }

  if (appState === 'ADMIN_DASHBOARD' && userProfile) {
    return <AdminDashboard user={userProfile} />;
  }

  // Default APP State (Students)
  return (
    <div className="bg-slate-50 min-h-screen flex w-full overflow-hidden">
      <Navigation currentView={currentView} setView={handleViewChange} />
      <main className="flex-1 w-full md:ml-64 h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 relative">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
