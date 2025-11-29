import React from 'react';
import { UserProfile } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Settings, LogOut, Award, ChevronRight, User } from 'lucide-react';

interface ProfileViewProps {
  user: UserProfile;
}

const data = [
  { name: 'Jan', earnings: 120 },
  { name: 'Feb', earnings: 200 },
  { name: 'Mar', earnings: 150 },
  { name: 'Apr', earnings: 300 },
  { name: 'May', earnings: 450 },
];

export const ProfileView: React.FC<ProfileViewProps> = ({ user }) => {
  return (
    <div className="pb-24 md:pb-8 min-h-screen bg-slate-50 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-b-3xl md:rounded-2xl shadow-sm border-slate-200 md:border">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-xl font-bold md:text-2xl">My Profile</h1>
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
              <Settings className="text-slate-400" size={24} />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center space-x-4">
              <img src={user.avatar} alt="Profile" className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-slate-50 shadow-md object-cover" />
              <div>
                <h2 className="text-lg md:text-xl font-bold text-slate-800">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.college}</p>
                <div className="flex gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified Student
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Trust Score: 98
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 flex-1 md:justify-end">
               <div className="flex-1 md:flex-none md:w-40 bg-primary-50 p-4 rounded-2xl border border-primary-100">
                 <p className="text-primary-600 text-xs font-bold uppercase mb-1">Total Earnings</p>
                 <p className="text-2xl font-bold text-slate-800">${user.earnings}</p>
               </div>
               <div className="flex-1 md:flex-none md:w-40 bg-secondary-50 p-4 rounded-2xl border border-emerald-100">
                 <p className="text-emerald-600 text-xs font-bold uppercase mb-1">Sustainability</p>
                 <p className="text-2xl font-bold text-slate-800">{user.savings} <span className="text-sm font-normal text-slate-500">pts</span></p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 md:p-0">
          {/* Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Earnings Activity</h3>
              <select className="text-xs bg-slate-50 border-none rounded-lg p-2 outline-none">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                     {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#0ea5e9' : '#cbd5e1'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Menu */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 h-fit">
            {[
              { icon: User, label: "Edit Profile" },
              { icon: Award, label: "My Badges", value: "3 New" },
              { icon: Settings, label: "Preferences" },
              { icon: LogOut, label: "Log Out", color: "text-red-500" },
            ].map((item, i) => (
              <button key={i} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors group">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${item.color ? 'bg-red-50' : 'bg-slate-50'} group-hover:scale-105 transition-transform`}>
                    <item.icon size={18} className={item.color || "text-slate-500"} />
                  </div>
                  <span className={`text-sm font-medium ${item.color || "text-slate-700"}`}>{item.label}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  {item.value && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{item.value}</span>}
                  <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};