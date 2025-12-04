
export type ModuleType = 'HOME' | 'BUY' | 'SELL' | 'RENT' | 'SHARE' | 'SWAP' | 'EARN' | 'REQUEST' | 'PROFILE' | 'ITEM_DETAIL' | 'CHAT_LIST' | 'CHAT_ROOM' | 'LANDING' | 'COLLEGE_LINK' | 'ADMIN_DASHBOARD' | 'MY_ORDERS' | 'TERMS' | 'PRIVACY' | 'SAFETY' | 'CONTACT' | 'ABOUT' | 'CAREERS' | 'PRESS';

export enum Category {
  ELECTRONICS = 'Electronics',
  BOOKS = 'Books',
  FURNITURE = 'Furniture',
  CLOTHING = 'Clothing',
  SERVICES = 'Services',
  VEHICLES = 'Vehicles',
  OTHER = 'Other'
}

export interface College {
  id: string;
  name: string;
  domain: string;
  latitude: number;
  longitude: number;
}

export interface Item {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string; // Primary thumbnail
  images: string[]; // Gallery
  category: Category;
  type: 'SALE' | 'RENT' | 'SHARE' | 'SWAP' | 'SERVICE' | 'REQUEST';
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
  personalEmail?: string;
  collegeEmail?: string;
  collegeEmailVerified?: boolean;
  name: string;
  college: string;
  role: 'STUDENT' | 'ADMIN';
  verified: boolean;
  savings: number;
  earnings: number;
  avatar: string;
  verificationStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  banned?: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: any; // Lucide Icon component
  color: string;
  condition: (user: UserProfile, stats?: any) => boolean;
}

export interface NavItem {
  id: ModuleType;
  label: string;
  icon: any; 
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
  item?: Item; // Joined data
}

export interface Booking {
  id: string;
  serviceId: string;
  bookerId: string;
  providerId: string;
  bookingDate: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  service?: Item; // Joined data
}

export interface SwapProposal {
  id: string;
  initiatorId: string;
  receiverId: string;
  targetItemId: string;
  offeredItemId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  targetItem?: Item;
  offeredItem?: Item;
}

export interface Review {
  id: string;
  reviewerId: string;
  targetUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName?: string;
  reviewerAvatar?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  itemId: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  item?: Item; // Joined data for Admin UI
}

export interface Notification {
  id: string;
  userId: string;
  type: 'MESSAGE' | 'ORDER' | 'SYSTEM' | 'ALERT';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}