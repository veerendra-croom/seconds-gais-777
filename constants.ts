import { Item, Category, UserProfile } from './types';

export const MOCK_USER: UserProfile = {
  id: 'user-123',
  email: 'alex.j@stanford.edu',
  name: "Alex Johnson",
  college: "Stanford University",
  verified: true,
  savings: 450,
  earnings: 1200,
  avatar: "https://picsum.photos/seed/user123/100/100",
  verificationStatus: 'VERIFIED'
};

export const MOCK_ITEMS: Item[] = [
  {
    id: '1',
    title: 'Calculus Early Transcendentals',
    price: 45,
    originalPrice: 120,
    image: 'https://picsum.photos/seed/book1/300/300',
    images: ['https://picsum.photos/seed/book1/300/300'],
    category: Category.BOOKS,
    type: 'SALE',
    sellerName: 'Sarah K.',
    college: 'Stanford',
    rating: 4.8,
    description: 'Used for one semester. No highlighting.',
    verified: true,
    status: 'ACTIVE'
  },
  {
    id: '2',
    title: 'Graphing Calculator TI-84',
    price: 10,
    originalPrice: 110,
    image: 'https://picsum.photos/seed/calc/300/300',
    images: ['https://picsum.photos/seed/calc/300/300'],
    category: Category.ELECTRONICS,
    type: 'RENT', // Rent per week
    sellerName: 'Mike R.',
    college: 'Stanford',
    rating: 4.5,
    description: 'Available for rent during midterms.',
    verified: true,
    status: 'ACTIVE'
  },
  {
    id: '3',
    title: 'Python Tutoring - 1hr',
    price: 25,
    image: 'https://picsum.photos/seed/code/300/300',
    images: ['https://picsum.photos/seed/code/300/300'],
    category: Category.SERVICES,
    type: 'SERVICE',
    sellerName: 'Dev Patel',
    college: 'Stanford',
    rating: 5.0,
    description: 'CS Major offering intro to Python help.',
    verified: true,
    status: 'ACTIVE'
  },
  {
    id: '4',
    title: 'Dorm Mini Fridge',
    price: 50,
    image: 'https://picsum.photos/seed/fridge/300/300',
    images: ['https://picsum.photos/seed/fridge/300/300'],
    category: Category.FURNITURE,
    type: 'SALE',
    sellerName: 'Jessica L.',
    college: 'Stanford',
    rating: 4.2,
    description: 'Moving out sale. Must pick up.',
    verified: true,
    status: 'ACTIVE'
  },
  {
    id: '5',
    title: 'Wireless Headphones',
    price: 0,
    image: 'https://picsum.photos/seed/audio/300/300',
    images: ['https://picsum.photos/seed/audio/300/300'],
    category: Category.ELECTRONICS,
    type: 'SWAP',
    sellerName: 'Tom H.',
    college: 'Stanford',
    rating: 4.9,
    description: 'Looking to swap for a mechanical keyboard.',
    verified: true,
    status: 'ACTIVE'
  }
];

export const COLLEGE_LIST = [
  "Stanford University",
  "UC Berkeley",
  "MIT",
  "Harvard University",
  "Local Community College"
];