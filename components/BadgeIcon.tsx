
import React from 'react';
import { Badge } from '../types';

interface BadgeIconProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({ badge, size = 'md', showLabel = false }) => {
  const Icon = badge.icon;
  
  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-16 h-16 p-4'
  };

  const iconSizes = {
    sm: 12,
    md: 20,
    lg: 32
  };

  return (
    <div className="group relative flex flex-col items-center">
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${badge.color} border border-white/50 shadow-sm transition-transform group-hover:scale-110`}>
        <Icon size={iconSizes[size]} strokeWidth={2.5} />
      </div>
      
      {showLabel && (
        <span className="text-[10px] font-bold text-slate-600 mt-1 text-center leading-tight max-w-[60px]">
          {badge.name}
        </span>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:block w-max max-w-[150px] bg-slate-800 text-white text-xs p-2 rounded-lg z-50 text-center shadow-xl animate-fade-in pointer-events-none">
        <p className="font-bold mb-0.5">{badge.name}</p>
        <p className="text-slate-300 font-light">{badge.description}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};
