import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { api } from './services/api';
import { UserProfile, Item, Conversation, ModuleType, Notification } from './types';
import { ToastProvider, useToast } from './components/Toast';
import { Navigation } from './components/Navigation';
import { SplashView } from './views/SplashView';
import { LandingView } from './views/LandingView';
import { AuthView } from './views/AuthView';
import { Home } from './views/Home';
import { SellItem } from './views/SellItem';
import { ProfileView } from './views/ProfileView';
import { ItemDetailView } from './views/ItemDetailView';
import { ChatListView } from './views/ChatListView';
import { ChatView } from './views/ChatView';
import { Marketplace } from './views/Marketplace';
import { VerificationView } from './views/VerificationView';
import { CollegeLinkView } from './views/CollegeLinkView';
import { AdminDashboard } from './views/AdminDashboard';
import { StaticPages } from './views/StaticPages';
import { OnboardingTour } from './components/OnboardingTour';

const AppContent: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ModuleType>('LANDING');
  
  // Navigation State
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showTour, setShowTour] = useState(false);
  
  // Sidebar State for Desktop (Auto-closed on smaller desktops/tablets)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  const { showToast } = useToast();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setLoading(false);
        setCurrentView('LANDING');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setCurrentView('LANDING');
        setLoading(false);
      }
    });

    // Auto-collapse sidebar on resize if screen gets too small
    const handleResize = () => {
       if (window.innerWidth <= 1024) setIsSidebarOpen(false);
       else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await api.getProfile(userId);
      if (profile) {
        setUserProfile(profile);
        // Determine initial view based on profile status
        if (profile.role === 'ADMIN') {
          setCurrentView('ADMIN_DASHBOARD');
        } else if (!profile.collegeEmailVerified && profile.role === 'STUDENT') {
           setCurrentView('COLLEGE_LINK'); 
        } else {
           setCurrentView('HOME');
        }
        
        // Check for onboarding
        const hasSeenTour = localStorage.getItem(`tour_seen_${userId}`);
        if (!hasSeenTour) setShowTour(true);
      }
    } catch (e) {
      console.error("Error fetching profile", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTourComplete = () => {
    setShowTour(false);
    if (userProfile) localStorage.setItem(`tour_seen_${userProfile.id}`, 'true');
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setCurrentView('ITEM_DETAIL');
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setCurrentView('SELL');
  };

  const handleSellBack = () => {
    if (editingItem) {
      setEditingItem(null);
      setCurrentView('PROFILE');
    } else {
      setEditingItem(null);
      setCurrentView('HOME');
    }
  };

  const handleStartChat = async (item: Item) => {
    if (!userProfile) return;
    try {
      // Find or create conversation logic could go here, or just navigate
      // For now, we pass context to ChatView
      setSelectedItem(item);
      setActiveConversation(null); // Clear active conversation to prioritize item context
      setCurrentView('CHAT_ROOM');
    } catch (e) {
      showToast("Could not start chat", 'error');
    }
  };

  const handleStartChatWithUser = (user: UserProfile) => {
     setActiveConversation({
        partnerId: user.id,
        partnerName: user.name,
        partnerAvatar: user.avatar,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
     });
     setSelectedItem(null);
     setCurrentView('CHAT_ROOM');
  };

  const handleViewProfile = async (userId: string) => {
    if (userProfile && userId === userProfile.id) {
      setCurrentView('PROFILE');
      return;
    }
    try {
      const profile = await api.getProfile(userId);
      if (profile) {
        setPublicProfile(profile);
        setCurrentView('PUBLIC_PROFILE');
      }
    } catch (e) {
      showToast("Could not load profile", 'error');
    }
  };

  const handleSelectChat = (conv: Conversation) => {
    setActiveConversation(conv);
    setSelectedItem(null); 
    setCurrentView('CHAT_ROOM');
  };

  const handleViewItemFromChat = async (itemId: string) => {
    try {
      // If we already have the item loaded (e.g. started chat from item), use it
      if (selectedItem && selectedItem.id === itemId) {
        setCurrentView('ITEM_DETAIL');
        return;
      }
      // Otherwise fetch it
      const item = await api.getItem(itemId);
      if (item) {
        setSelectedItem(item);
        setCurrentView('ITEM_DETAIL');
      }
    } catch (e) {
      console.error("Failed to load item from chat", e);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (n.link === 'CHAT_LIST') {
      setCurrentView('CHAT_LIST');
    } else if (n.link === 'MY_ORDERS') {
      setCurrentView('MY_ORDERS');
    } else if (n.link === 'PROFILE') {
      setCurrentView('PROFILE');
    } else if (n.link && n.link.startsWith('ITEM_DETAIL:')) {
      const itemId = n.link.split(':')[1];
      handleViewItemFromChat(itemId);
    }
  };

  const handleViewChange = (view: ModuleType) => {
    if (currentView === 'SELL' && view !== 'SELL') setEditingItem(null);
    if (view === 'CHAT_LIST') setActiveConversation(null);
    // Reset search when leaving marketplace if manually changing view
    if (view !== 'BUY' && view !== 'RENT' && view !== 'SHARE' && view !== 'SWAP' && view !== 'EARN' && view !== 'REQUEST') {
       setGlobalSearchQuery('');
    }
    setCurrentView(view);
  }

  const handleSearch = (query: string) => {
    setGlobalSearchQuery(query);
    setCurrentView('BUY'); // Default to Buy module for results
  };

  const renderView = () => {
    // Public/Auth Views
    if (currentView === 'LANDING') return <LandingView onGetStarted={() => setCurrentView('AUTH')} onViewPage={setCurrentView} />;
    if (currentView === 'AUTH') return <AuthView onSuccess={() => window.location.reload()} onBack={() => setCurrentView('LANDING')} onViewPage={setCurrentView} />;
    if (['TERMS', 'PRIVACY', 'SAFETY', 'CONTACT', 'ABOUT', 'CAREERS', 'PRESS'].includes(currentView)) {
      return <StaticPages type={currentView} onBack={() => userProfile ? setCurrentView('HOME') : setCurrentView('LANDING')} user={userProfile} />;
    }

    if (!userProfile) return <SplashView />;

    // Authenticated Views
    if (currentView === 'ADMIN_DASHBOARD') return <AdminDashboard user={userProfile} onSwitchToApp={() => setCurrentView('HOME')} />;
    if (currentView === 'COLLEGE_LINK') return <CollegeLinkView userId={userProfile.id} onSuccess={() => setCurrentView('HOME')} />;

    switch (currentView) {
      case 'HOME': return <Home user={userProfile} onModuleSelect={setCurrentView} onItemClick={handleItemClick} onSearch={handleSearch} onNotificationClick={handleNotificationClick} />;
      case 'SELL': return <SellItem user={userProfile} onBack={handleSellBack} itemToEdit={editingItem} />;
      case 'PROFILE': return <ProfileView user={userProfile} onEditItem={handleEditItem} />;
      case 'MY_ORDERS': return <ProfileView user={userProfile} onEditItem={handleEditItem} initialTab="BUYING" />;
      case 'PUBLIC_PROFILE': 
        return publicProfile 
          ? <ProfileView user={publicProfile} isPublic onStartChat={handleStartChatWithUser} onBack={() => setCurrentView('HOME')} /> 
          : <div className="p-20 text-center">Loading Profile...</div>;
      case 'ITEM_DETAIL': 
        if (!selectedItem) return <Home user={userProfile} onModuleSelect={setCurrentView} onItemClick={handleItemClick} onSearch={handleSearch} onNotificationClick={handleNotificationClick} />;
        return <ItemDetailView item={selectedItem} currentUser={userProfile} onBack={() => setCurrentView('HOME')} onChat={handleStartChat} onViewProfile={handleViewProfile} />;
      case 'CHAT_LIST': return <ChatListView user={userProfile} onSelectChat={handleSelectChat} onBack={() => setCurrentView('HOME')} />;
      case 'CHAT_ROOM': return <ChatView currentUser={userProfile} activeConversation={activeConversation} targetItem={selectedItem || undefined} onBack={() => setCurrentView('CHAT_LIST')} onViewItem={handleViewItemFromChat} />;
      case 'BUY':
      case 'RENT':
      case 'SHARE':
      case 'SWAP':
      case 'EARN':
      case 'REQUEST':
        return <Marketplace type={currentView} onBack={() => setCurrentView('HOME')} onItemClick={handleItemClick} initialSearchQuery={globalSearchQuery} user={userProfile} />;
      default: return <Home user={userProfile} onModuleSelect={setCurrentView} onItemClick={handleItemClick} onSearch={handleSearch} onNotificationClick={handleNotificationClick} />;
    }
  };

  if (loading) return <SplashView />;

  // Logic to determine if sidebar should be shown (same as render logic)
  const showSidebar = userProfile && !['LANDING', 'AUTH', 'CHAT_ROOM', 'ITEM_DETAIL', 'ADMIN_DASHBOARD', 'COLLEGE_LINK', 'SELL'].includes(currentView) && !['TERMS', 'PRIVACY', 'SAFETY', 'CONTACT', 'ABOUT', 'CAREERS', 'PRESS'].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Show Navigation only for authenticated main views */}
      {showSidebar && (
        <Navigation 
          currentView={currentView === 'MY_ORDERS' || currentView === 'PUBLIC_PROFILE' ? 'PROFILE' : currentView} 
          setView={handleViewChange} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      )}
      
      {/* 
         Main Content Wrapper 
         Adjusts left padding on desktop when sidebar is open to prevent overlapping 
      */}
      <main className={`transition-all duration-300 ease-in-out ${showSidebar && isSidebarOpen ? 'md:pl-64' : ''}`}>
        {renderView()}
      </main>

      {showTour && <OnboardingTour onComplete={handleTourComplete} />}
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}