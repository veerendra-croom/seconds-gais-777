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
import { ModuleType, UserProfile, Item } from './types';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [appState, setAppState] = useState<'LOADING' | 'AUTH' | 'VERIFICATION' | 'APP'>('LOADING');
  const [currentView, setCurrentView] = useState<ModuleType>('HOME');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        handleUserLoaded(session.user.id);
      } else {
        setAppState('AUTH');
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
        setAppState('AUTH');
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserLoaded = async (userId: string) => {
    try {
      const profile = await api.getProfile(userId);
      
      if (profile) {
        setUserProfile(profile);
        
        // Logic for verification flow
        const hasSkippedVerification = localStorage.getItem('skipped_verification');
        
        if (profile.verified || profile.verificationStatus === 'VERIFIED' || hasSkippedVerification) {
          setAppState('APP');
        } else {
          setAppState('VERIFICATION');
        }
      } else {
        // Profile might not exist yet if triggers failed or just registered
        // In a real app, we might redirect to a "Complete Profile" page
        // For now, assume auth is enough to show verification
        setAppState('VERIFICATION');
      }
    } catch (error) {
      console.error("Error loading user", error);
      setAppState('AUTH');
    }
  };

  const handleVerificationComplete = () => {
    localStorage.setItem('skipped_verification', 'true');
    setAppState('APP');
    // Optionally refresh profile here
    if (session?.user?.id) handleUserLoaded(session.user.id);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setCurrentView('SELL');
  };

  const handleSellBack = () => {
    setEditingItem(null); // Clear editing state
    setCurrentView('HOME');
  };

  const renderView = () => {
    if (!userProfile) return null;

    switch (currentView) {
      case 'HOME':
        return <Home user={userProfile} onModuleSelect={setCurrentView} />;
      case 'SELL':
        return (
          <SellItem 
            user={userProfile} 
            onBack={handleSellBack} 
            itemToEdit={editingItem}
          />
        );
      case 'PROFILE':
        return <ProfileView user={userProfile} onEditItem={handleEditItem} />;
      case 'BUY':
      case 'RENT':
      case 'SHARE':
      case 'SWAP':
      case 'EARN':
      case 'REQUEST':
        return <Marketplace type={currentView} onBack={() => setCurrentView('HOME')} />;
      default:
        return <Home user={userProfile} onModuleSelect={setCurrentView} />;
    }
  };

  if (appState === 'LOADING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={40} />
      </div>
    );
  }

  if (appState === 'AUTH') {
    return <AuthView onSuccess={() => {}} />; // Session listener handles transition
  }

  if (appState === 'VERIFICATION') {
    return <VerificationView userId={session?.user?.id} onVerificationComplete={handleVerificationComplete} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen flex w-full overflow-hidden">
      <Navigation currentView={currentView} setView={(view) => {
        // If navigating away from SELL, clear editing item
        if (currentView === 'SELL' && view !== 'SELL') {
          setEditingItem(null);
        }
        setCurrentView(view);
      }} />
      <main className="flex-1 w-full md:ml-64 h-screen overflow-y-auto overflow-x-hidden transition-all duration-300 relative">
        {renderView()}
      </main>
    </div>
  );
};

export default App;