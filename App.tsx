import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Home } from './views/Home';
import { Marketplace } from './views/Marketplace';
import { SellItem } from './views/SellItem';
import { ProfileView } from './views/ProfileView';
import { ModuleType } from './types';
import { MOCK_USER } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ModuleType>('HOME');

  const renderView = () => {
    switch (currentView) {
      case 'HOME':
        return <Home user={MOCK_USER} onModuleSelect={setCurrentView} />;
      case 'SELL':
        return <SellItem onBack={() => setCurrentView('HOME')} />;
      case 'PROFILE':
        return <ProfileView user={MOCK_USER} />;
      case 'BUY':
      case 'RENT':
      case 'SHARE':
      case 'SWAP':
      case 'EARN':
      case 'REQUEST':
        return <Marketplace type={currentView} onBack={() => setCurrentView('HOME')} />;
      default:
        return <Home user={MOCK_USER} onModuleSelect={setCurrentView} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex">
      {/* 
        Navigation Component handles:
        1. Fixed Sidebar on Desktop (md+)
        2. Fixed Bottom Bar on Mobile (<md)
      */}
      <Navigation currentView={currentView} setView={setCurrentView} />

      {/* Main Content Area */}
      {/* md:ml-64 adds margin to push content to right of sidebar on desktop */}
      <main className="flex-1 w-full md:ml-64 transition-all duration-300">
        {renderView()}
      </main>
    </div>
  );
};

export default App;