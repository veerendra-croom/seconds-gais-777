
import { supabase } from './supabaseClient';
import { Item, UserProfile, Category, Message, Conversation, Transaction, Booking } from '../types';

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
   * Fetch User Profile
   */
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', JSON.stringify(error));
      return null;
    }

    if (!data) return null;

    // COMPUTE STATUS DYNAMICALLY
    let computedStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED' = 'NONE';
    
    if (data.verified === true) {
      computedStatus = 'VERIFIED';
    } else if (data.college_email_verified === true) {
      computedStatus = 'PENDING';
    }

    return {
      id: data.id,
      email: data.email,
      personalEmail: data.personal_email,
      collegeEmail: data.college_email,
      collegeEmailVerified: data.college_email_verified,
      name: data.full_name,
      college: data.college,
      role: data.role || 'STUDENT',
      verified: data.verified,
      verificationStatus: computedStatus, 
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
      .upsert({
        id: profile.id,
        email: profile.email,
        personal_email: profile.email, 
        full_name: profile.name,
        college: profile.college,
        role: profile.role || 'STUDENT',
        avatar_url: profile.avatar,
        verified: false,
        college_email_verified: false
      });

    if (error) {
      console.error("Failed to create profile (RLS or Constraint)", error);
      throw error;
    }
  },

  /**
   * Link College Email (Gatekeeper Step)
   */
  linkCollegeEmail: async (userId: string, collegeEmail: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        college_email: collegeEmail,
        college_email_verified: true, // Auto-verify email for demo
      })
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Verify Admin Code against App Config
   */
  checkAdminCode: async (code: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'admin_signup_code')
      .maybeSingle();
    
    if (data) {
      return data.value === code;
    }
    
    if (error || !data) {
      console.warn("Using default admin code logic (DB config missing)");
      return code === 'rani';
    }
    
    return false;
  },

  /**
   * Update Admin Code (CMS Feature)
   */
  updateAdminCode: async (newCode: string) => {
    const { error } = await supabase
      .from('app_config')
      .upsert({ key: 'admin_signup_code', value: newCode });
    
    if (error) throw error;
  },

  /**
   * ADMIN: Get Pending Verifications
   */
  adminGetPendingVerifications: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('college_email_verified', true)
      .eq('verified', false)
      .eq('role', 'STUDENT');

    if (error) return [];
    return data;
  },

  /**
   * ADMIN: Verify User
   */
  adminVerifyUser: async (userId: string, approve: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        verified: approve
      })
      .eq('id', userId);
    
    if (error) throw error;
  },

  /**
   * ADMIN: Get Stats
   */
  adminGetStats: async () => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: itemCount } = await supabase.from('items').select('*', { count: 'exact', head: true });
    
    return {
      users: userCount || 0,
      items: itemCount || 0,
      gmv: 12500 
    };
  },

  // --- STANDARD ITEM METHODS ---

  getItems: async (type: string, category: string | 'All'): Promise<Item[]> => {
    let query = supabase
      .from('items')
      .select(`*, profiles:seller_id (full_name, college, verified)`)
      .eq('status', 'ACTIVE');

    let dbType = type;
    if (type === 'BUY') dbType = 'SALE';
    if (type === 'EARN') dbType = 'SERVICE';
    
    if (['SALE', 'RENT', 'SWAP', 'SERVICE'].includes(dbType)) {
        query = query.eq('type', dbType);
    }

    if (category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

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
        sellerName: item.profiles?.full_name || 'Unknown',
        college: item.profiles?.college || item.college || 'Unknown',
        verified: item.profiles?.verified || false,
        rating: item.rating || 5.0,
        description: item.description,
        status: item.status
      };
    });
  },

  getUserItems: async (userId: string): Promise<Item[]> => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

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
        sellerName: 'Me', 
        college: item.college,
        rating: item.rating,
        description: item.description,
        verified: true,
        status: item.status
      };
    });
  },

  getTrendingItems: async (): Promise<Item[]> => {
    const { data, error } = await supabase
      .from('items')
      .select(`*, profiles:seller_id (full_name, college, verified)`)
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

  uploadImage: async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error } = await supabase.storage.from('items').upload(filePath, file);
    if (error) return null;
    const { data } = supabase.storage.from('items').getPublicUrl(filePath);
    return data.publicUrl;
  },

  createItem: async (item: Omit<Item, 'id' | 'sellerName' | 'verified' | 'rating' | 'college' | 'status'> & { status?: string, images: string[] }, userId: string, college: string) => {
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
        image: imagePayload,
        seller_id: userId,
        college: college,
        status: item.status || 'ACTIVE'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateItem: async (itemId: string, updates: Partial<Item> & { images?: string[] }) => {
    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.type) dbUpdates.type = updates.type;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.images) dbUpdates.image = JSON.stringify(updates.images);
    else if (updates.image) dbUpdates.image = updates.image;

    const { data, error } = await supabase.from('items').update(dbUpdates).eq('id', itemId).select().single();
    if (error) throw error;
    return data;
  },

  deleteItem: async (itemId: string) => {
    const { error } = await supabase.from('items').delete().eq('id', itemId);
    if (error) throw error;
  },

  // --- CHAT METHODS ---

  sendMessage: async (senderId: string, receiverId: string, content: string, itemId?: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: senderId, receiver_id: receiverId, content: content, item_id: itemId })
      .select().single();
    if (error) throw error;
    return data;
  },

  getMessages: async (currentUserId: string, otherUserId: string, itemId?: string) => {
    let query = supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;

    return data.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      itemId: msg.item_id,
      content: msg.content,
      createdAt: msg.created_at,
      isRead: msg.is_read
    })) as Message[];
  },

  subscribeToMessages: (userId: string, callback: (msg: Message) => void) => {
    return supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, (payload) => {
        const msg = payload.new;
        callback({
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.receiver_id,
          itemId: msg.item_id,
          content: msg.content,
          createdAt: msg.created_at,
          isRead: msg.is_read
        });
      })
      .subscribe();
  },

  getConversations: async (userId: string): Promise<Conversation[]> => {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`*, sender:sender_id (full_name, avatar_url), receiver:receiver_id (full_name, avatar_url), item:item_id (title, image)`)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) return [];

    const conversationsMap = new Map<string, Conversation>();

    messages.forEach((msg: any) => {
      const isSender = msg.sender_id === userId;
      const partnerId = isSender ? msg.receiver_id : msg.sender_id;
      const partnerProfile = isSender ? msg.receiver : msg.sender;
      
      if (!conversationsMap.has(partnerId)) {
        const itemImages = parseImages(msg.item?.image);
        conversationsMap.set(partnerId, {
          partnerId: partnerId,
          partnerName: partnerProfile?.full_name || 'Unknown User',
          partnerAvatar: partnerProfile?.avatar_url || `https://ui-avatars.com/api/?name=User&background=random`,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          itemId: msg.item_id,
          itemTitle: msg.item?.title,
          itemImage: itemImages[0],
          unreadCount: (!isSender && !msg.is_read) ? 1 : 0
        });
      } else {
        if (!isSender && !msg.is_read) {
          const conv = conversationsMap.get(partnerId)!;
          conv.unreadCount += 1;
        }
      }
    });

    return Array.from(conversationsMap.values());
  },

  // --- TRANSACTION & BOOKING METHODS ---
  createTransaction: async (data: Partial<Transaction>) => {
    const { error } = await supabase.from('transactions').insert({
       buyer_id: data.buyerId,
       seller_id: data.sellerId,
       item_id: data.itemId,
       amount: data.amount,
       status: 'PENDING'
    });
    if (error) throw error;
  },

  createBooking: async (data: Partial<Booking>) => {
    const { error } = await supabase.from('bookings').insert({
       booker_id: data.bookerId,
       provider_id: data.providerId,
       service_id: data.serviceId,
       booking_date: data.bookingDate,
       status: 'REQUESTED'
    });
    if (error) throw error;
  },

  getUserOrders: async (userId: string) => {
    // This would fetch from both transactions and bookings tables
    // Returning empty for now as simple MVP placeholder
    return [];
  }
};
