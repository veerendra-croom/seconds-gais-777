
import React, { useEffect, useState } from 'react';
import { AppNotification } from '../types';
import { api } from '../services/api';
import { Bell, CheckCircle2, ChevronLeft, MessageCircle, Package, AlertCircle, Calendar } from 'lucide-react';

interface NotificationsViewProps {
  userId: string;
  onBack: () => void;
  onNotificationClick: (n: AppNotification) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ userId, onBack, onNotificationClick }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications(userId);
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      // In a real app, API would have a bulk endpoint
      // await api.markAllNotificationsAsRead(userId);
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => api.markNotificationAsRead(n.id)));
    } catch (e) {
      console.error(e);
    }
  };

  const groupNotifications = () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    const groups: Record<string, AppNotification[]> = {
      'Today': [],
      'Yesterday': [],
      'Earlier': []
    };

    notifications.forEach(n => {
      const d = new Date(n.createdAt).toDateString();
      if (d === today) groups['Today'].push(n);
      else if (d === yesterday) groups['Yesterday'].push(n);
      else groups['Earlier'].push(n);
    });

    return groups;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <Package size={20} className="text-blue-500" />;
      case 'MESSAGE': return <MessageCircle size={20} className="text-green-500" />;
      case 'SYSTEM': return <AlertCircle size={20} className="text-amber-500" />;
      default: return <Bell size={20} className="text-slate-500" />;
    }
  };

  const groups = groupNotifications();

  return (
    <div className="pb-24 md:pb-8 bg-slate-50 min-h-screen">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h1>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="text-xs font-bold text-primary-600 hover:text-primary-700">
            Mark all read
          </button>
        )}
      </div>

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Bell size={32} />
             </div>
             <p className="text-slate-500 font-medium">No notifications yet.</p>
          </div>
        ) : (
          Object.entries(groups).map(([label, group]) => (
            group.length > 0 && (
              <div key={label} className="animate-slide-up">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">{label}</h3>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                  {group.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => onNotificationClick(n)}
                      className={`p-4 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</p>
                           <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                             {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                      </div>
                      {!n.isRead && (
                        <div className="self-center">
                           <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
};
