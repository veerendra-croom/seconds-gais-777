export type ModuleType = 'HOME' | 'BUY' | 'SELL' | 'RENT' | 'SHARE' | 'SWAP' | 'EARN' | 'REQUEST' | 'PROFILE';

export enum Category {
  ELECTRONICS = 'Electronics',
  BOOKS = 'Books',
  FURNITURE = 'Furniture',
  CLOTHING = 'Clothing',
  SERVICES = 'Services',
  VEHICLES = 'Vehicles',
  OTHER = 'Other'
}

export interface Item {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string; // Primary thumbnail
  images: string[]; // Gallery
  category: Category;
  type: 'SALE' | 'RENT' | 'SHARE' | 'SWAP' | 'SERVICE';
  sellerId?: string; // Link to profile
  sellerName: string;
  college: string;
  rating: number;
  description: string;
  verified: boolean;
  status: 'ACTIVE' | 'SOLD' | 'DRAFT' | 'ARCHIVED';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  college: string;
  verified: boolean;
  savings: number; // Sustainability metric
  earnings: number;
  avatar: string;
  verificationStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface NavItem {
  id: ModuleType;
  label: string;
  icon: any; // Lucide icon component
  color: string;
}