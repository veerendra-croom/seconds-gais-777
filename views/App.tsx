
import React, { useState, useEffect, useRef } from 'react';
import { supabase, signOut } from '../services/supabaseClient';
import { api } from '../services/api';
import { UserProfile, Item, Conversation, ModuleType, AppNotification } from '../types';
import { ToastProvider, useToast } from '../components/Toast';
import { Navigation } from '../components/Navigation';
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
import { OrderDetailView } from './views/OrderDetailView';
import { NotificationsView } from './views/NotificationsView';
import { QRScannerView } from './views/QRScannerView';
import { SellerDashboardView } from './views/SellerDashboardView';
import { SafetyView } from './views/SafetyView';
import { OnboardingTour } from './components/OnboardingTour';
import { WifiOff, Construction, Lock } from 'lucide-react';
import { VoiceCommander } from './components/VoiceCommander';
import { NotFoundView } from './views/NotFoundView';
import { UserActivityLogView } from './views/UserActivityLogView';
import { HelpCenterView } from './views/HelpCenterView';
import { SecuritySettingsView } from './views/SecuritySettingsView';
import { DataPrivacyView } from './views/DataPrivacyView';
import { SetupWizardView } from './views/SetupWizardView';
import { CommunityView } from './views/CommunityView';

// Views accessible without authentication
const PUBLIC_VIEWS: ModuleType[] = ['LANDING', 'AUTH', 'TERMS', 'PRIVACY', 'CONTACT', 'ABOUT', 'CAREERS', 'PRESS', 'NOT_FOUND'];

const AppContent: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ModuleType>('LANDING');
  
  // Navigation State
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<{data: any, type: 'PURCHASE' | 'SALE' | 'BOOKING' | 'OFFER'} | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // App Config State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  // QR Scan State
  const [scanContext, setScanContext] = useState<{expectedCode: string, orderId: string} | null>(null);
  
  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);

  // History State Tracker
  const isPoppingHistory = useRef(false);
  
  // Sync view ref for async callbacks
  const currentViewRef = useRef<ModuleType>('LANDING');

  const { showToast } = useToast();

  const changeView = (view: ModuleType) => {
    currentViewRef.current = view;
    setCurrentView(view);
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    api.getAppConfig('maintenance_mode').then(val => {
       setMaintenanceMode(val === 'true');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
        if (!PUBLIC_VIEWS.includes(currentViewRef.current)) {
           changeView('LANDING');
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        if (!userProfile) fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
        // Only force Landing if not currently on a public/auth view
        if (!PUBLIC_VIEWS.includes(currentViewRef.current)) {
           changeView('LANDING');
        }
      }
    });

    const handleResize = () => {
       if (window.innerWidth <= 1024) setIsSidebarOpen(false);
       else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        isPoppingHistory.current = true;
        changeView(event.state.view);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (isPoppingHistory.current) {
      isPoppingHistory.current = false;
      return;
    }
    try {
      window.history.pushState({ view: currentView }, '', `#${currentView.toLowerCase()}`);
    } catch (e) {
      // Quiet fail for environments restricted by History API
    }
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    if (userProfile && !loading) {
      const hasSeenWizard = localStorage.getItem(`setup_wizard_${userProfile.id}`);
      if (!hasSeenWizard) {
        setShowWizard(true);
      } else {
        const hasSeenTour = localStorage.getItem(`tour_seen_${userProfile.id}`);
        if (!hasSeenTour) setShowTour(true);
      }
    }
  }, [userProfile, loading]);

  const handleGlobalBack = () => {
    if (window.history.length > 1) {
      try {
        window.history.back();
      } catch (e) {
        changeView(userProfile ? 'HOME' : 'LANDING');
      }
    } else {
      changeView(userProfile ? 'HOME' : 'LANDING');
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const profile = await api.getProfile(userId);
      if (profile) {
        setUserProfile(profile);
        if (profile.role === 'ADMIN') {
          changeView('ADMIN_DASHBOARD');
        } else if (!profile.collegeEmailVerified && profile.role === 'STUDENT') {
           changeView('COLLEGE_LINK'); 
        } else {
           if (currentViewRef.current === 'LANDING' || currentViewRef.current === 'AUTH') {
              changeView('HOME');
           }
        }
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const handleWizardComplete = () => {
    if (userProfile) {
      localStorage.setItem(`setup_wizard_${userProfile.id}`, 'completed');
      setShowWizard(false);
      const hasSeenTour = localStorage.getItem(`tour_seen_${userProfile.id}`);
      if (!hasSeenTour) setShowTour(true);
    }
  };

  const handleTourComplete = () => {
    if (userProfile) {
      localStorage.setItem(`tour_seen_${userProfile.id}`, 'true');
      setShowTour(false);
    }
  };

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    changeView('ITEM_DETAIL');
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    changeView('SELL');
  };

  const handleStartChat = async (item: Item) => {
    if (!userProfile) return;
    setSelectedItem(item);
    setActiveConversation(null); 
    changeView('CHAT_ROOM');
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
     changeView('CHAT_ROOM');
  };

  const handleViewProfile = async (userId: string) => {
    if (userProfile && userId === userProfile.id) {
      changeView('PROFILE');
      return;
    }
    const profile = await api.getProfile(userId);
    if (profile) {
      setPublicProfile(profile);
      changeView('PUBLIC_PROFILE');
    }
  };

  const handleSelectChat = (conv: Conversation) => {
    setActiveConversation(conv);
    setSelectedItem(null); 
    changeView('CHAT_ROOM');
  };

  const handleViewItemFromChat = async (itemId: string) => {
    const item = await api.getItem(itemId);
    if (item) {
      setSelectedItem(item);
      changeView('ITEM_DETAIL');
    }
  };

  const handleViewOrder = (order: any, type: 'PURCHASE' | 'SALE' | 'BOOKING' | 'OFFER') => {
     setSelectedOrder({ data: order, type });
     changeView('ORDER_DETAIL');
  };

  const handleStartScan = (expectedCode: string, orderId: string) => {
     setScanContext({ expectedCode, orderId });
     changeView('QR_SCANNER');
  };

  const handleScanSuccess = async (code: string) => {
     if (!userProfile || !scanContext) return;
     try {
       await api.confirmOrder(scanContext.orderId, userProfile.id);
       showToast("Handover Verified! Order Complete.", 'success');
       changeView('ORDER_DETAIL');
     } catch (e) {
       showToast("Verification failed.", 'error');
     }
  };

  const handleNotificationClick = (n: AppNotification) => {
    api.markNotificationAsRead(n.id);
    if (n.link === 'CHAT_LIST') changeView('CHAT_LIST');
    else if (n.link === 'MY_ORDERS') changeView('MY_ORDERS');
    else if (n.link === 'PROFILE') changeView('PROFILE');
    else if (n.link && n.link.startsWith('ITEM_DETAIL:')) {
      const itemId = n.link.split(':')[1];
      handleViewItemFromChat(itemId);
    }
  };

  const handleSearch = (query: string) => {
    setGlobalSearchQuery(query);
    changeView('BUY'); 
  };

  const renderView = () => {
    if (currentView === 'LANDING') return <LandingView onGetStarted={() => changeView('AUTH')} onViewPage={changeView} />;
    if (currentView === 'AUTH') return <AuthView onSuccess={() => window.location.reload()} onBack={() => changeView('LANDING')} onViewPage={changeView} />;
    if (['TERMS', 'PRIVACY', 'CONTACT', 'ABOUT', 'CAREERS', 'PRESS'].includes(currentView)) {
      return <StaticPages type={currentView} onBack={handleGlobalBack} user={userProfile} />;
    }

    if (!userProfile) return <SplashView />;

    if (currentView === 'ADMIN_DASHBOARD') return <AdminDashboard user={userProfile} onSwitchToApp={() => changeView('HOME')} onBack={handleGlobalBack} />;
    
    if (maintenanceMode && (userProfile.role as string) !== 'ADMIN') {
       return (
         <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8">
               <Construction size={48} className="text-amber-400" />
            </div>
            <h1 className="text-3xl font-black text-white mb-4">Under Maintenance</h1>
            <p className="text-slate-400 max-w-sm leading-relaxed mb-8">Upgrading platform...</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold">Try Again</button>
         </div>
       );
    }

    if (currentView === 'COLLEGE_LINK') return <CollegeLinkView userId={userProfile.id} onSuccess={() => changeView('HOME')} />;

    switch (currentView) {
      case 'HOME': return <Home user={userProfile} onModuleSelect={changeView} onItemClick={handleItemClick} onSearch={handleSearch} onNotificationClick={handleNotificationClick} onBack={handleGlobalBack} />;
      case 'SELL': return <SellItem user={userProfile} onBack={handleGlobalBack} itemToEdit={editingItem} />;
      case 'PROFILE': return <ProfileView user={userProfile} onEditItem={handleEditItem} onViewOrder={handleViewOrder} onGoToDashboard={() => changeView('SELLER_DASHBOARD')} onBack={handleGlobalBack} onNavigate={changeView} />;
      case 'MY_ORDERS': return <ProfileView user={userProfile} onEditItem={handleEditItem} initialTab="BUYING" onViewOrder={handleViewOrder} onBack={handleGlobalBack} onNavigate={changeView} />;
      case 'PUBLIC_PROFILE': 
        return publicProfile 
          ? <ProfileView user={publicProfile} isPublic onStartChat={handleStartChatWithUser} onBack={handleGlobalBack} /> 
          : <div className="p-20 text-center">Loading Profile...</div>;
      case 'ITEM_DETAIL': 
        if (!selectedItem) return <Home user={userProfile} onModuleSelect={changeView} onItemClick={handleItemClick} onSearch={handleSearch} onNotificationClick={handleNotificationClick} onBack={handleGlobalBack} />;
        return <ItemDetailView item={selectedItem} currentUser={userProfile} onBack={handleGlobalBack} onChat={handleStartChat} onViewProfile={handleViewProfile} onItemClick={handleItemClick} />;
      case 'ORDER_DETAIL':
        if (!selectedOrder) return <Home user={userProfile} onModuleSelect={changeView} onItemClick={handleItemClick} onSearch={handleSearch} onNotificationClick={handleNotificationClick} onBack={handleGlobalBack} />;
        return <OrderDetailView order={selectedOrder.data} type={selectedOrder.type} user={userProfile} onBack={handleGlobalBack} onChat={handleStartChatWithUser} onScan={handleStartScan} />;
      case 'NOTIFICATIONS': 
        return <NotificationsView userId={userProfile.id} onBack={handleGlobalBack} onNotificationClick={handleNotificationClick} />;
      case 'QR_SCANNER':
        return <QRScannerView onBack={handleGlobalBack} onScanSuccess={handleScanSuccess} />;
      case 'SELLER_DASHBOARD': 
        return <SellerDashboardView user={userProfile} onBack={handleGlobalBack} onEditItem={handleEditItem} />;
      case 'SAFETY':
        return <SafetyView user={userProfile} onBack={handleGlobalBack} onVerifyClick={() => changeView('COLLEGE_LINK')} />;
      case 'HELP_CENTER':
        return <HelpCenterView onBack={handleGlobalBack} userId={userProfile.id} />;
      case 'ACTIVITY_LOG':
        return <UserActivityLogView onBack={handleGlobalBack} />;
      case 'SECURITY_SETTINGS':
        return <SecuritySettingsView onBack={handleGlobalBack} />;
      case 'DATA_PRIVACY':
        return <DataPrivacyView user={userProfile} onBack={handleGlobalBack} />;
      case 'CHAT_LIST': return <ChatListView user={userProfile} onSelectChat={handleSelectChat} onBack={handleGlobalBack} />;
      case 'CHAT_ROOM': return <ChatView currentUser={userProfile} activeConversation={activeConversation} targetItem={selectedItem || undefined} onBack={handleGlobalBack} onViewItem={handleViewItemFromChat} />;
      case 'BUY':
      case 'RENT':
      case 'SHARE':
      case 'SWAP':
      case 'EARN':
      case 'REQUEST':
        return <Marketplace type={currentView} user={userProfile} onBack={handleGlobalBack} onItemClick={handleItemClick} initialSearchQuery={globalSearchQuery} onSellClick={() => changeView('SELL')} />;
      case 'COMMUNITY':
        return <CommunityView user={userProfile} onBack={handleGlobalBack} onItemClick={handleItemClick} onChat={handleStartChat} onPostClick={() => changeView('SELL')} />;
      case 'NOT_FOUND':
        return <NotFoundView onGoHome={() => changeView('HOME')} />;
      default: return <Home user={userProfile} onModuleSelect={changeView} onItemClick={handleItemClick} onSearch={handleSearch} onNotificationClick={handleNotificationClick} onBack={handleGlobalBack} />;
    }
  };

  if (loading) return <SplashView />;

  const showSidebar = userProfile && !maintenanceMode && !['LANDING', 'AUTH', 'CHAT_ROOM', 'ITEM_DETAIL', 'ADMIN_DASHBOARD', 'COLLEGE_LINK', 'SELL', 'ORDER_DETAIL', 'NOTIFICATIONS', 'QR_SCANNER', 'SELLER_DASHBOARD', 'SAFETY', 'HELP_CENTER', 'ACTIVITY_LOG', 'NOT_FOUND', 'SECURITY_SETTINGS', 'DATA_PRIVACY', 'SETUP_WIZARD'].includes(currentView) && !['TERMS', 'PRIVACY', 'CONTACT', 'ABOUT', 'CAREERS', 'PRESS'].includes(currentView);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {isOffline && (
        <div className="bg-slate-900 text-white text-xs font-bold py-2 text-center fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 animate-slide-up">
           <WifiOff size={14} /> You are offline.
        </div>
      )}

      {showSidebar && (
        <Navigation 
          currentView={currentView === 'MY_ORDERS' || currentView === 'PUBLIC_PROFILE' || currentView === 'ORDER_DETAIL' || currentView === 'NOTIFICATIONS' || currentView === 'SELLER_DASHBOARD' ? 'PROFILE' : currentView} 
          setView={changeView} 
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          userRole={userProfile.role}
        />
      )}
      
      <main className={`transition-all duration-300 ease-in-out ${showSidebar && isSidebarOpen ? 'md:pl-64' : ''}`}>
        {renderView()}
      </main>

      {userProfile && !maintenanceMode && <VoiceCommander onNavigate={changeView} onSearch={handleSearch} onLogout={signOut} />}
      {showWizard && <SetupWizardView onComplete={handleWizardComplete} user={userProfile} />}
      {showTour && !showWizard && <OnboardingTour onComplete={handleTourComplete} />}
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
