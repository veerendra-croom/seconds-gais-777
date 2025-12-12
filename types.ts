
export type ModuleType = 'HOME' | 'BUY' | 'SELL' | 'RENT' | 'SHARE' | 'SWAP' | 'EARN' | 'REQUEST' | 'COMMUNITY' | 'PROFILE' | 'PUBLIC_PROFILE' | 'ITEM_DETAIL' | 'ORDER_DETAIL' | 'CHAT_LIST' | 'CHAT_ROOM' | 'NOTIFICATIONS' | 'QR_SCANNER' | 'SELLER_DASHBOARD' | 'LANDING' | 'AUTH' | 'COLLEGE_LINK' | 'ADMIN_DASHBOARD' | 'MY_ORDERS' | 'TERMS' | 'PRIVACY' | 'SAFETY' | 'CONTACT' | 'ABOUT' | 'CAREERS' | 'PRESS' | 'HELP_CENTER' | 'ACTIVITY_LOG' | 'NOT_FOUND' | 'SECURITY_SETTINGS' | 'DATA_PRIVACY' | 'SETUP_WIZARD';

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

export interface Bid {
  id: string;
  itemId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  createdAt: string;
}

export interface Item {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string; // Primary thumbnail
  images: string[]; // Gallery
  category: Category;
  type: 'SALE' | 'RENT' | 'SHARE' | 'SWAP' | 'SERVICE' | 'REQUEST' | 'AUCTION';
  sellerId?: string; // Link to profile
  sellerName: string;
  college: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  description: string;
  verified: boolean;
  status: 'ACTIVE' | 'SOLD' | 'DRAFT' | 'ARCHIVED';
  views?: number;
  
  // Auction specific
  auctionEndsAt?: string;
  bids?: Bid[];
  currentBid?: number;
  bidCount?: number;
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
  bio?: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    website?: string;
  };
  trustedContacts?: string[]; // List of emails
  referralCode?: string;
  referralsCount?: number;
  preferences?: {
    interestedCategories?: string[];
    primaryGoal?: 'BUY' | 'SELL' | 'BOTH';
  };
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
  image?: string;
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
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  createdAt: string;
  meetupCode?: string; // 6 digit secure code
  meetupLocation?: string;
  item?: Item; // Joined data
  buyer?: { full_name: string, avatar_url: string };
  seller?: { full_name: string, avatar_url: string };
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
  booker?: { full_name: string, avatar_url: string };
  provider?: { full_name: string, avatar_url: string };
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
  initiator?: { full_name: string, avatar_url: string };
}

export interface Review {
  id: string;
  reviewerId: string;
  targetUserId: string;
  orderId?: string;
  rating: number;
  comment: string;
  tags?: string[];
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
  item?: Partial<Item>; // Joined data for Admin UI
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'MESSAGE' | 'ORDER' | 'SYSTEM' | 'ALERT';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  last4: string;
  holderName: string;
  
}

export interface Device {
  id: string;
  userId: string;
  subscription: PushSubscription;
  createdAt: string;
}
