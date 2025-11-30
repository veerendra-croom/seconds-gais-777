import { supabase } from './supabaseClient';
import { Item, UserProfile, Category } from '../types';

// Helper to parse image column which might be a single URL string or a JSON array string
const parseImages = (imgStr: string | null): string[] => {
  if (!imgStr) return [];
  try {
    // Check if it looks like a JSON array
    if (imgStr.trim().startsWith('[')) {
      const parsed = JSON.parse(imgStr);
      return Array.isArray(parsed) ? parsed : [imgStr];
    }
    return [imgStr];
  } catch (e) {
    return [imgStr];
  }
};

export const api = {
  /**
   * Fetch User Profile including verification status
   */
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    // Use maybeSingle() instead of single() to avoid throwing error if row is missing
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', JSON.stringify(error));
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      name: data.full_name,
      college: data.college,
      verified: data.verified,
      verificationStatus: data.verification_status,
      savings: data.savings,
      earnings: data.earnings,
      avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name)}&background=0ea5e9&color=fff`
    };
  },

  /**
   * Create a new profile after Registration
   */
  createProfile: async (profile: Partial<UserProfile> & { id: string }) => {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: profile.id,
        email: profile.email,
        full_name: profile.name,
        college: profile.college,
        avatar_url: profile.avatar,
        verified: false,
        verification_status: 'NONE'
      });

    if (error) throw error;
  },

  /**
   * Get Items filtered by Type and Category
   */
  getItems: async (type: string, category: string | 'All'): Promise<Item[]> => {
    let query = supabase
      .from('items')
      .select(`
        *,
        profiles:seller_id (
          full_name,
          college,
          verified
        )
      `)
      .eq('status', 'ACTIVE'); // Only show active items

    // Map frontend module type to DB item type if necessary
    let dbType = type;
    if (type === 'BUY') dbType = 'SALE';
    if (type === 'EARN') dbType = 'SERVICE';
    
    // Filter by type if it's not a global search
    if (['SALE', 'RENT', 'SWAP', 'SERVICE'].includes(dbType)) {
        query = query.eq('type', dbType);
    }

    if (category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
      return [];
    }

    return data.map((item: any) => {
      const images = parseImages(item.image);
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        originalPrice: item.original_price,
        image: images[0] || 'https://via.placeholder.com/300?text=No+Image',
        images: images,
        category: item.category as Category,
        type: item.type,
        sellerId: item.seller_id,
        sellerName: item.profiles?.full_name || 'Unknown',
        college: item.profiles?.college || item.college || 'Unknown',
        verified: item.profiles?.verified || false,
        rating: item.rating || 5.0,
        description: item.description,
        status: item.status
      };
    });
  },

  /**
   * Get items belonging to a specific user (Profile View)
   */
  getUserItems: async (userId: string): Promise<Item[]> => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user items:', error);
      return [];
    }

    return data.map((item: any) => {
      const images = parseImages(item.image);
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        originalPrice: item.original_price,
        image: images[0] || 'https://via.placeholder.com/300?text=No+Image',
        images: images,
        category: item.category as Category,
        type: item.type,
        sellerId: item.seller_id,
        sellerName: 'Me', 
        college: item.college,
        rating: item.rating,
        description: item.description,
        verified: true,
        status: item.status
      };
    });
  },

  /**
   * Get Trending Items (Latest 4 items for now)
   */
  getTrendingItems: async (): Promise<Item[]> => {
    const { data, error } = await supabase
      .from('items')
      .select(`
        *,
        profiles:seller_id (full_name, college, verified)
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) return [];

    return data.map((item: any) => {
      const images = parseImages(item.image);
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        originalPrice: item.original_price,
        image: images[0] || 'https://via.placeholder.com/300?text=No+Image',
        images: images,
        category: item.category as Category,
        type: item.type,
        sellerId: item.seller_id,
        sellerName: item.profiles?.full_name || 'Unknown User',
        college: item.college,
        verified: item.profiles?.verified || false,
        rating: item.rating,
        description: item.description,
        status: item.status
      };
    });
  },

  /**
   * Upload Image to Storage Bucket
   */
  uploadImage: async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
      .from('items')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data } = supabase.storage.from('items').getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Create new Item listing
   * Handles saving multiple images by serializing array to JSON string
   */
  createItem: async (item: Omit<Item, 'id' | 'sellerName' | 'verified' | 'rating' | 'college' | 'status'> & { status?: string, images: string[] }, userId: string, college: string) => {
    // Serialize images array to string for DB storage
    // If only 1 image, we could just store string, but JSON array is more flexible for future
    const imagePayload = item.images.length > 0 ? JSON.stringify(item.images) : null;

    const { data, error } = await supabase
      .from('items')
      .insert({
        title: item.title,
        description: item.description,
        price: item.price,
        original_price: item.originalPrice,
        category: item.category,
        type: item.type,
        image: imagePayload, // Store as JSON string
        seller_id: userId,
        college: college,
        status: item.status || 'ACTIVE'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update existing item
   */
  updateItem: async (itemId: string, updates: Partial<Item> & { images?: string[] }) => {
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.status) dbUpdates.status = updates.status;
    
    // Handle images update
    if (updates.images) {
      dbUpdates.image = JSON.stringify(updates.images);
    } else if (updates.image) {
      // Fallback if single image string is passed
      dbUpdates.image = updates.image;
    }

    const { data, error } = await supabase
      .from('items')
      .update(dbUpdates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete item
   */
  deleteItem: async (itemId: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
  }
};