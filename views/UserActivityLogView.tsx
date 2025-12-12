
import React from 'react';
import { ChevronLeft, Shield, LogIn, Edit, Trash2, CreditCard, Lock, Smartphone } from 'lucide-react';

interface UserActivityLogViewProps {
  onBack: () => void;
}

// Mock data generator for activity logs
const generateLogs = () => {
  return [
    { id: '1', action: 'LOGIN', description: 'Successful login via Email', device: 'iPhone 13 Pro', location: 'Los Angeles, CA', timestamp: new Date().toISOString() },
    { id: '2', action: 'UPDATE', description: 'Updated profile bio', device: 'Desktop Chrome', location: 'Los Angeles, CA', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', action: 'SECURITY', description: 'Changed password', device: 'Desktop Chrome', location: 'Los Angeles, CA', timestamp: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: '4', action: 'TRANSACTION', description: 'Withdrawal of $45.00 initiated', device: 'iPhone 13 Pro', location: 'Los Angeles, CA', timestamp: new Date(Date.now() - 86400000 * 7).toISOString() },
    { id: '5', action: 'LOGIN', description: 'New device login', device: 'iPad Air', location: 'San Diego, CA', timestamp: new Date(Date.now() - 86400000 * 12).toISOString() },
  ];
};

export const UserActivityLogView: React.FC<UserActivityLogViewProps> = ({ onBack }) => {
  const logs = generateLogs();

  const getIcon = (action: string) => {
    switch(action) {
      case 'LOGIN': return <LogIn size={16} className="text-blue-500" />;
      case 'SECURITY': return <Lock size={16} className="text-red-500" />;
      case 'TRANSACTION': return <CreditCard size={16} className="text-green-500" />;
      default: return <Edit size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Security Log</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 mb-8">
           <Shield className="text-blue-600 shrink-0" size={24} />
           <div>
              <h3 className="text-sm font-bold text-blue-900">Account Security</h3>
              <p className="text-xs text-blue-700 mt-1">
                 Review your recent account activity. If you see something suspicious, change your password immediately.
              </p>
           </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-4 border-b border-slate-50 bg-slate-50/50">
              <h3 className="font-bold text-sm text-slate-700">Recent Activity</h3>
           </div>
           
           <div className="relative">
              {/* Vertical Line */}
              <div className="absolute top-0 bottom-0 left-8 w-px bg-slate-100 z-0"></div>

              <div className="divide-y divide-slate-50">
                 {logs.map((log) => (
                    <div key={log.id} className="p-4 flex gap-4 relative z-10 hover:bg-slate-50 transition-colors">
                       <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                          {getIcon(log.action)}
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <p className="text-sm font-bold text-slate-800">{log.description}</p>
                             <span className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                             <span className="flex items-center gap-1"><Smartphone size={12}/> {log.device}</span>
                             <span>•</span>
                             <span>{log.location}</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
