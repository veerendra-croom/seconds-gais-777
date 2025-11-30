
export type ModuleType = 'HOME' | 'BUY' | 'SELL' | 'RENT' | 'SHARE' | 'SWAP' | 'EARN' | 'REQUEST' | 'PROFILE' | 'ITEM_DETAIL' | 'CHAT_LIST' | 'CHAT_ROOM' | 'LANDING' | 'COLLEGE_LINK' | 'ADMIN_DASHBOARD' | 'MY_ORDERS';

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
  email: string; // This is the login email (Personal for students, Any for admin)
  personalEmail?: string;
  collegeEmail?: string;
  collegeEmailVerified?: boolean;
  name: string;
  college: string;
  role: 'STUDENT' | 'ADMIN';
  verified: boolean; // ID Card verification
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

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  itemId?: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  itemId?: string;
  itemTitle?: string;
  itemImage?: string;
  unreadCount: number;
}

export interface Transaction {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  bookerId: string;
  providerId: string;
  bookingDate: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}
