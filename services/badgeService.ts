
import { UserProfile, Badge } from '../types';
import { ShieldCheck, Leaf, TrendingUp, Star, Zap, Award } from 'lucide-react';

export const AVAILABLE_BADGES: Badge[] = [
  {
    id: 'verified_pro',
    name: 'Verified Student',
    description: 'Identity confirmed via School ID',
    icon: ShieldCheck,
    color: 'text-blue-500 bg-blue-50',
    condition: (user) => user.verified
  },
  {
    id: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Saved over $100 worth of resources (approx 5kg CO2)',
    icon: Leaf,
    color: 'text-green-500 bg-green-50',
    condition: (user) => (user.savings || 0) > 100
  },
  {
    id: 'campus_tycoon',
    name: 'Campus Tycoon',
    description: 'Earned over $500 from sales',
    icon: TrendingUp,
    color: 'text-purple-500 bg-purple-50',
    condition: (user) => (user.earnings || 0) > 500
  },
  {
    id: 'top_rated',
    name: 'Top Rated',
    description: 'Maintain a 5-star rating',
    icon: Star,
    color: 'text-amber-500 bg-amber-50',
    condition: (user, stats) => (stats?.averageRating || 0) >= 4.8
  },
  {
    id: 'power_seller',
    name: 'Power Seller',
    description: 'Completed 10+ transactions',
    icon: Zap,
    color: 'text-orange-500 bg-orange-50',
    condition: (user, stats) => (stats?.totalSales || 0) >= 10
  }
];

export const getUserBadges = (user: UserProfile, stats?: { averageRating?: number, totalSales?: number }): Badge[] => {
  return AVAILABLE_BADGES.filter(badge => badge.condition(user, stats));
};
