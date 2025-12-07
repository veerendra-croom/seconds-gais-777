import { supabase } from './supabaseClient';
import { Item, Category, UserProfile, Notification, Conversation, Message, Review, Report, Transaction, Booking, SwapProposal, BankAccount, College } from '../types';

const parseImages = (imageField: any): string[] => {
  if (Array.isArray(imageField)) return imageField;
  if (typeof imageField === 'string') {
    try {
      const parsed = JSON.parse(imageField);
      if (Array.isArray(parsed)) return parsed;
      return [imageField];
    } catch {
      return [imageField];
    }
  }
  return [];
};

// Client-side image compression utility
const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const maxWidth = 1200;
    const maxHeight = 1200;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Compression failed"));
        }, 'image/jpeg', 0.8); // 80% quality JPEG
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const api = {
  // --- ITEMS ---
  getItem: async (itemId: string): Promise<Item | null> => {
    const { data, error } = await supabase.from('items').select(`*, profiles:seller_id (full_name, college, verified, banned)`).eq('id', itemId).maybeSingle();
    
    if (error || !data) return null;
    
    const images = parseImages(data.image);
    return {
      id: data.id,
      title: data.title,
      price: data.price,
      originalPrice: data.original_price,
      image: images[0] || 'https://via.placeholder.com/300?text=No+Image',
      images: images,
      category: data.category as Category,
      type: data.type,
      sellerId: data.seller_id,
      sellerName: data.profiles?.full_name || 'Unknown',
      college: data.profiles?.college || data.college || 'Unknown',
      verified: data.profiles?.verified || false,
      rating: data.rating || 5.0,
      description: data.description,
      status: data.status
    };
  },

  getItems: async (
    type: string, 
    category: string | 'All', 
    searchQuery?: string, 
    filters?: { minPrice?: number, maxPrice?: number, condition?: string[], sortBy?: string, college?: string, verifiedOnly?: boolean, minRating?: number },
    page: number = 0, 
    limit: number = 12
  ): Promise<Item[]> => {
    // If filtering by verification status, we need to use an inner join to filter on the joined 'profiles' table.
    // Otherwise, standard left join is sufficient.
    const profileSelect = filters?.verifiedOnly ? 'profiles!inner' : 'profiles';
    
    let query = supabase.from('items')
      .select(`*, ${profileSelect}:seller_id (full_name, college, verified, banned)`)
      .eq('status', 'ACTIVE');
    
    // Type Filter
    let dbType = type;
    if (type === 'BUY') dbType = 'SALE';
    if (type === 'EARN') dbType = 'SERVICE';
    if (['SALE', 'RENT', 'SWAP', 'SERVICE', 'REQUEST'].includes(dbType)) {
      query = query.eq('type', dbType);
    }
    
    // Category Filter
    if (category !== 'All') query = query.eq('category', category);

    // Search Filter
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    // Advanced Filters
    if (filters) {
      if (filters.minPrice !== undefined && filters.minPrice > 0) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice !== undefined && filters.maxPrice > 0) query = query.lte('price', filters.maxPrice);
      
      // College Filter (Default to user's college, unless 'All' is specified)
      if (filters.college && filters.college !== 'All') {
        query = query.eq('college', filters.college);
      }

      // Verification Filter (Handled via !inner join above + where clause here)
      if (filters.verifiedOnly) {
        query = query.eq(`${profileSelect}.verified`, true);
      }

      // Rating Filter
      if (filters.minRating !== undefined && filters.minRating > 0) {
        query = query.gte('rating', filters.minRating);
      }
    }

    // Explicitly exclude items from banned users (Note: accessing nested properties in filter varies by setup, 
    // but typically !inner filters rows. If using left join, we filter in JS post-fetch for banned, or assume row policy handles it)
    if (!filters?.verifiedOnly) {
       // If standard join, we still prefer not to show banned users. 
       // However, typical PostgREST filtering on embedded resource is tricky without !inner.
       // We'll filter banned users in the map/filter block below for safety if not using inner join.
    }

    // Sorting
    if (filters?.sortBy === 'PRICE_ASC') {
      query = query.order('price', { ascending: true });
    } else if (filters?.sortBy === 'PRICE_DESC') {
      query = query.order('price', { ascending: false });
    } else {
      // Default NEWEST
      query = query.order('created_at', { ascending: false });
    }

    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await query.range(from, to);
    
    if (error) return [];

    return data
      .filter((item: any) => !item.profiles?.banned) 
      .map((item: any) => {
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

  getTrendingItems: async (): Promise<Item[]> => {
    return await api.getItems('BUY', 'All', undefined, undefined, 0, 4);
  },

  getSimilarItems: async (category: string, currentItemId: string): Promise<Item[]> => {
    const { data, error } = await supabase
      .from('items')
      .select(`*, profiles:seller_id (full_name, college, verified)`)
      .eq('category', category)
      .eq('status', 'ACTIVE')
      .neq('id', currentItemId)
      .limit(4);

    if (error || !data) return [];

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

  getUserItems: async (userId: string, status?: 'ACTIVE' | 'SOLD' | 'DRAFT'): Promise<Item[]> => {
    let query = supabase.from('items').select('*').eq('seller_id', userId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return [];
    
    return data.map((item: any) => ({
       id: item.id,
       title: item.title,
       price: item.price,
       originalPrice: item.original_price,
       image: parseImages(item.image)[0],
       images: parseImages(item.image),
       category: item.category as Category,
       type: item.type,
       sellerId: item.seller_id,
       sellerName: '', // Populated elsewhere if needed
       college: item.college,
       rating: item.rating || 5,
       description: item.description,
       verified: false,
       status: item.status
    }));
  },

  createItem: async (itemData: any, userId: string, college: string): Promise<Item | null> => {
    const { data, error } = await supabase.from('items').insert({
      seller_id: userId,
      title: itemData.title,
      description: itemData.description,
      price: itemData.price,
      original_price: itemData.originalPrice,
      category: itemData.category,
      type: itemData.type,
      image: JSON.stringify(itemData.images),
      college: college,
      status: itemData.status
    }).select().single();
    
    if (error) throw error;
    return data;
  },

  updateItem: async (itemId: string, updates: any): Promise<void> => {
    const dbUpdates = { ...updates };
    if (dbUpdates.images) {
      dbUpdates.image = JSON.stringify(dbUpdates.images);
      delete dbUpdates.images;
    }
    const { error } = await supabase.from('items').update(dbUpdates).eq('id', itemId);
    if (error) throw error;
  },

  deleteItem: async (itemId: string): Promise<void> => {
    const { data: item } = await supabase.from('items').select('image').eq('id', itemId).single();
    if (item && item.image) {
      const images = parseImages(item.image);
      const filesToRemove = images.map(url => {
        const parts = url.split('/');
        return parts[parts.length - 1];
      }).filter(Boolean);

      if (filesToRemove.length > 0) {
        await supabase.storage.from('items').remove(filesToRemove);
      }
    }
    const { error } = await supabase.from('items').delete().eq('id', itemId);
    if (error) throw error;
  },

  uploadImage: async (file: File): Promise<string | null> => {
    try {
      let fileToUpload: File | Blob = file;
      if (file.size > 1024 * 1024) { 
         try {
           fileToUpload = await compressImage(file);
         } catch (e) {
           console.warn("Compression failed, using original file", e);
         }
      }
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('items').upload(filePath, fileToUpload, { upsert: false });

      if (uploadError) return null;

      const { data } = supabase.storage.from('items').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      return null;
    }
  },

  // --- PROFILES ---

  getProfile: async (userId: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.full_name,
      college: data.college,
      role: data.role,
      verified: data.verified,
      savings: data.savings || 0,
      earnings: data.earnings || 0,
      avatar: data.avatar_url || `https://ui-avatars.com/api/?name=${data.full_name}`,
      verificationStatus: data.verification_status || 'NONE',
      banned: data.banned,
      bio: data.bio,
      socialLinks: data.social_links,
      collegeEmail: data.college_email,
      collegeEmailVerified: data.college_email_verified
    };
  },

  createProfile: async (profile: Partial<UserProfile>): Promise<void> => {
    const { error } = await supabase.from('profiles').insert({
      id: profile.id,
      email: profile.email,
      full_name: profile.name,
      college: profile.college,
      role: profile.role,
      avatar_url: profile.avatar
    });
    if (error) throw error;
  },

  updateProfile: async (userId: string, updates: any): Promise<void> => {
    const { error } = await supabase.from('profiles').update({
       full_name: updates.name,
       avatar_url: updates.avatar,
       bio: updates.bio,
       social_links: updates.socialLinks
    }).eq('id', userId);
    if (error) throw error;
  },

  // --- USER ANALYTICS ---
  
  getUserEarningsHistory: async (userId: string): Promise<any[]> => {
    const { data } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('seller_id', userId)
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: true });

    if (!data) return [];

    const monthlyData: Record<string, number> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]}`;
      monthlyData[key] = 0;
    }

    data.forEach((txn: any) => {
      const d = new Date(txn.created_at);
      const key = monthNames[d.getMonth()];
      if (monthlyData.hasOwnProperty(key)) {
        monthlyData[key] += txn.amount;
      }
    });

    return Object.entries(monthlyData).map(([name, earnings]) => ({ name, earnings }));
  },

  // --- NOTIFICATIONS & SAVED ---

  subscribeToNotifications: (userId: string, callback: (n: Notification) => void) => {
    return supabase.channel(`notifications:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
      (payload) => {
        callback({
          id: payload.new.id,
          userId: payload.new.user_id,
          type: payload.new.type,
          title: payload.new.title,
          message: payload.new.message,
          isRead: false,
          createdAt: payload.new.created_at,
          link: payload.new.link
        });
      }).subscribe();
  },

  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    if (error) return [];
    return data.map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      createdAt: n.created_at,
      link: n.link
    }));
  },

  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
  },

  getSavedItems: async (userId: string): Promise<Item[]> => {
    const { data, error } = await supabase.from('saved_items').select('item_id, items(*)').eq('user_id', userId);
    if (error) return [];
    return data.map((row: any) => {
       const item = row.items;
       return {
          id: item.id,
          title: item.title,
          price: item.price,
          image: parseImages(item.image)[0],
          images: parseImages(item.image),
          category: item.category as Category,
          type: item.type,
          sellerId: item.seller_id,
          sellerName: 'Unknown',
          college: item.college,
          rating: 5,
          description: item.description,
          verified: false,
          status: item.status
       };
    });
  },

  checkIsSaved: async (userId: string, itemId: string): Promise<boolean> => {
     const { data } = await supabase.from('saved_items').select('id').eq('user_id', userId).eq('item_id', itemId).maybeSingle();
     return !!data;
  },

  toggleSavedItem: async (userId: string, itemId: string): Promise<boolean> => {
     const isSaved = await api.checkIsSaved(userId, itemId);
     if (isSaved) {
       await supabase.from('saved_items').delete().eq('user_id', userId).eq('item_id', itemId);
       return false;
     } else {
       await supabase.from('saved_items').insert({ user_id: userId, item_id: itemId });
       return true;
     }
  },

  // --- ORDERS / BOOKINGS / SWAPS ---

  getUserOrders: async (userId: string): Promise<{purchases: any[], bookings: any[], swaps: any[]}> => {
    const [purchases, bookings, swaps] = await Promise.all([
       supabase.from('transactions').select('*, item:items(*)').eq('buyer_id', userId),
       supabase.from('bookings').select('*, service:items(*)').eq('booker_id', userId),
       supabase.from('swap_proposals').select('*, offeredItem:offered_item_id(*), targetItem:target_item_id(*)').eq('initiator_id', userId)
    ]);
    return {
       purchases: purchases.data || [],
       bookings: bookings.data || [],
       swaps: swaps.data || []
    };
  },

  getIncomingOffers: async (userId: string): Promise<any[]> => {
     const { data, error } = await supabase.from('swap_proposals')
       .select('*, initiator:profiles!initiator_id(*), offeredItem:items!offered_item_id(*), targetItem:items!target_item_id(*)')
       .eq('receiver_id', userId)
       .eq('status', 'PENDING');
     return data || [];
  },

  getProviderBookings: async (userId: string): Promise<any[]> => {
     const { data, error } = await supabase.from('bookings')
       .select('*, booker:profiles!booker_id(*), service:items!service_id(*)')
       .eq('provider_id', userId);
     return data || [];
  },

  respondToProposal: async (id: string, status: string): Promise<void> => {
     await supabase.from('swap_proposals').update({ status }).eq('id', id);
  },

  updateBookingStatus: async (id: string, status: string): Promise<void> => {
     await supabase.from('bookings').update({ status }).eq('id', id);
  },

  confirmOrder: async (transactionId: string, userId: string): Promise<void> => {
     const { error } = await supabase.rpc('complete_order', { p_txn_id: transactionId, p_user_id: userId });
     if (error) throw error;
  },

  createTransaction: async (data: any): Promise<void> => {
     const { error } = await supabase.rpc('create_order', { 
        p_buyer_id: data.buyerId,
        p_seller_id: data.sellerId,
        p_item_id: data.itemId,
        p_amount: data.amount
     });
     if (error) throw error;
  },

  createBooking: async (data: any): Promise<void> => {
     const { error } = await supabase.from('bookings').insert({
        booker_id: data.bookerId,
        provider_id: data.providerId,
        service_id: data.serviceId,
        booking_date: data.bookingDate,
        status: 'REQUESTED'
     });
     if (error) throw error;
  },

  createSwapProposal: async (data: any): Promise<void> => {
     const { error } = await supabase.from('swap_proposals').insert({
        initiator_id: data.initiatorId,
        receiver_id: data.receiverId,
        target_item_id: data.targetItemId,
        offered_item_id: data.offeredItemId,
        status: 'PENDING'
     });
     if (error) throw error;
  },

  // --- REVIEWS & REPORTS ---

  getReviews: async (userId: string): Promise<Review[]> => {
     const { data, error } = await supabase.from('reviews').select('*, reviewer:profiles!reviewer_id(full_name, avatar_url)').eq('target_user_id', userId);
     if (error) return [];
     return data.map((r: any) => ({
        id: r.id,
        reviewerId: r.reviewer_id,
        targetUserId: r.target_user_id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        reviewerName: r.reviewer?.full_name,
        reviewerAvatar: r.reviewer?.avatar_url
     }));
  },

  createReview: async (data: any): Promise<void> => {
     const { error } = await supabase.from('reviews').insert({
        reviewer_id: data.reviewerId,
        target_user_id: data.targetUserId,
        rating: data.rating,
        comment: data.comment
     });
     if (error) throw error;
  },

  createReport: async (data: any): Promise<void> => {
     const { error } = await supabase.from('reports').insert({
        reporter_id: data.reporterId,
        item_id: data.itemId === 'SUPPORT_TICKET' ? null : data.itemId,
        reason: data.reason,
        status: 'PENDING'
     });
     if (error) throw error;
  },

  // --- MESSAGING ---

  getConversations: async (userId: string): Promise<Conversation[]> => {
     const { data: messages, error } = await supabase
      .from('messages')
      .select(`*, sender:sender_id (full_name, avatar_url), receiver:receiver_id (full_name, avatar_url), item:item_id (title, image)`)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error || !messages) return [];

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

  getMessages: async (userId: string, partnerId: string, itemId?: string): Promise<Message[]> => {
     let query = supabase.from('messages')
       .select('*')
       .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
       .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
       .order('created_at', { ascending: true });
     
     if (itemId) query = query.eq('item_id', itemId);

     const { data, error } = await query;
     if (error) return [];

     return data.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        itemId: m.item_id,
        content: m.content,
        image: m.image_url,
        createdAt: m.created_at,
        isRead: m.is_read
     }));
  },

  sendMessage: async (senderId: string, receiverId: string, content: string, itemId?: string, imageUrl?: string): Promise<void> => {
     const { error } = await supabase.from('messages').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: content,
        item_id: itemId,
        image_url: imageUrl
     });
     if (error) throw error;
  },

  markMessagesAsRead: async (senderId: string, receiverId: string): Promise<void> => {
    await supabase.from('messages')
      .update({ is_read: true })
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId)
      .eq('is_read', false);
  },

  subscribeToMessages: (userId: string, callback: (msg: Message) => void) => {
    return supabase.channel(`messages:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, 
      (payload) => {
         callback({
            id: payload.new.id,
            senderId: payload.new.sender_id,
            receiverId: payload.new.receiver_id,
            content: payload.new.content,
            image: payload.new.image_url,
            itemId: payload.new.item_id,
            createdAt: payload.new.created_at,
            isRead: false
         });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, 
      (payload) => {
      })
      .subscribe();
  },

  blockUser: async (blockerId: string, blockedId: string): Promise<void> => {
     const { error } = await supabase.from('blocked_users').insert({ blocker_id: blockerId, blocked_id: blockedId });
     if (error && error.code !== '23505') throw error;
  },

  unblockUser: async (blockerId: string, blockedId: string): Promise<void> => {
     await supabase.from('blocked_users').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
  },

  getBlockedUsers: async (userId: string): Promise<any[]> => {
     const { data } = await supabase.from('blocked_users').select('blocked:blocked_id(id, full_name, avatar_url)').eq('blocker_id', userId);
     return data?.map((r: any) => ({ id: r.blocked.id, name: r.blocked.full_name, avatar: r.blocked.avatar_url })) || [];
  },

  checkIsBlocked: async (userId: string, otherId: string): Promise<boolean> => {
     const { data } = await supabase.from('blocked_users').select('id')
       .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${userId})`)
       .maybeSingle();
     return !!data;
  },

  // --- COLLEGES & VERIFICATION ---

  getColleges: async (): Promise<College[]> => {
     const { data } = await supabase.from('colleges').select('*');
     return data || [];
  },

  addCollege: async (college: Omit<College, 'id'>): Promise<void> => {
     const { error } = await supabase.from('colleges').insert(college);
     if (error) throw error;
  },

  updateCollege: async (id: string, updates: Partial<College>): Promise<void> => {
     const { error } = await supabase.from('colleges').update(updates).eq('id', id);
     if (error) throw error;
  },

  deleteCollege: async (id: string): Promise<void> => {
     const { error } = await supabase.from('colleges').delete().eq('id', id);
     if (error) throw error;
  },

  sendCollegeVerification: async (email: string): Promise<string> => {
     const otp = Math.floor(100000 + Math.random() * 900000).toString();
     const { error } = await supabase.from('verification_codes').insert({
        email: email,
        code: otp
     });
     if (error) throw error;
     console.log(`%c[EMAILING SERVICE] Verification Code for ${email}: ${otp}`, 'color: #0ea5e9; font-weight: bold; font-size: 14px;');
     return otp;
  },

  verifyCollegeEmail: async (userId: string, email: string, otp: string): Promise<void> => {
     const { data, error } = await supabase.from('verification_codes')
       .select('*')
       .eq('email', email)
       .eq('code', otp)
       .gt('expires_at', new Date().toISOString())
       .order('created_at', { ascending: false })
       .limit(1)
       .maybeSingle();

     if (!data) throw new Error("Invalid or expired verification code.");

     await supabase.from('profiles').update({ 
        college_email: email,
        college_email_verified: true,
        verification_status: 'PENDING'
     }).eq('id', userId);

     await supabase.from('verification_codes').delete().eq('id', data.id);
  },

  adminGetVerificationImage: async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase.storage.from('verifications').list('', {
      search: `${userId}-student-id`
    });

    if (data && data.length > 0) {
      const fileName = data[0].name;
      const { data: urlData } = await supabase.storage.from('verifications').createSignedUrl(fileName, 3600);
      return urlData?.signedUrl || null;
    }

    return null;
  },

  // --- ADMIN ---

  checkAdminCode: async (code: string): Promise<boolean> => {
     const { data } = await supabase.from('app_config').select('value').eq('key', 'admin_signup_code').single();
     return data?.value === code;
  },

  updateAppConfig: async (key: string, value: string): Promise<void> => {
     await supabase.from('app_config').upsert({ key, value });
  },

  getAppConfig: async (key: string): Promise<string | null> => {
     const { data } = await supabase.from('app_config').select('value').eq('key', key).maybeSingle();
     return data?.value || null;
  },

  getAllAppConfigs: async (): Promise<Record<string, string>> => {
     const { data } = await supabase.from('app_config').select('key, value');
     const configs: Record<string, string> = {};
     data?.forEach(row => configs[row.key] = row.value);
     return configs;
  },

  adminGetStats: async (): Promise<any> => {
     const [users, items, transactions] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('items').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('amount')
     ]);
     const gmv = (transactions.data || []).reduce((sum, txn: any) => sum + (txn.amount || 0), 0);
     return { 
       users: users.count || 0, 
       items: items.count || 0, 
       gmv: gmv 
     };
  },

  adminGetAnalytics: async (): Promise<any> => {
     const sevenDaysAgo = new Date();
     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
     
     const { data: recentSales } = await supabase
       .from('transactions')
       .select('amount, created_at')
       .gte('created_at', sevenDaysAgo.toISOString());

     const { data: recentUsers } = await supabase
       .from('profiles')
       .select('created_at')
       .gte('created_at', sevenDaysAgo.toISOString());

     const { data: categoryItems } = await supabase
       .from('items')
       .select('category');

     const chartDataMap: Record<string, { sales: number, users: number }> = {};
     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
     
     for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        chartDataMap[dayName] = { sales: 0, users: 0 };
     }

     recentSales?.forEach((sale: any) => {
        const d = new Date(sale.created_at);
        const dayName = days[d.getDay()];
        if (chartDataMap[dayName]) chartDataMap[dayName].sales += sale.amount;
     });

     recentUsers?.forEach((user: any) => {
        const d = new Date(user.created_at);
        const dayName = days[d.getDay()];
        if (chartDataMap[dayName]) chartDataMap[dayName].users += 1;
     });

     const categoryMap: Record<string, number> = {};
     categoryItems?.forEach((item: any) => {
        const cat = item.category || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
     });

     return {
        chartData: Object.entries(chartDataMap).map(([name, val]) => ({ name, ...val })).reverse(), 
        categoryData: Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
     };
  },

  adminGetRecentTransactions: async (): Promise<any[]> => {
    const { data } = await supabase
      .from('transactions')
      .select('*, buyer:profiles!buyer_id(full_name), seller:profiles!seller_id(full_name), item:items(title)')
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  },

  adminGetPendingVerifications: async (): Promise<any[]> => {
     const { data } = await supabase.from('profiles').select('*').eq('college_email_verified', true).eq('verified', false).eq('role', 'STUDENT');
     return data || [];
  },

  adminGetReports: async (): Promise<Report[]> => {
     const { data } = await supabase.from('reports').select('*, item:items(*)').eq('status', 'PENDING');
     if (!data) return [];
     return data.map((r: any) => ({
        id: r.id,
        reporterId: r.reporter_id,
        itemId: r.item_id,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
        item: r.item ? { id: r.item.id, title: r.item.title } : undefined
     }));
  },

  adminGetAllUsers: async (page: number, limit: number, search: string): Promise<{users: any[], count: number}> => {
     let query = supabase.from('profiles').select('*', { count: 'exact' });
     if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
     
     const { data, count } = await query.range(page * limit, (page + 1) * limit - 1);
     return { users: data || [], count: count || 0 };
  },

  adminVerifyUser: async (userId: string, approve: boolean): Promise<void> => {
     await supabase.from('profiles').update({ verified: approve }).eq('id', userId);
     await supabase.from('notifications').insert({
        user_id: userId,
        type: 'SYSTEM',
        title: approve ? 'You are Verified! 🎉' : 'Verification Rejected',
        message: approve ? 'You can now trade freely on Seconds.' : 'Please upload a clear photo of your student ID.',
        link: 'PROFILE'
     });
  },

  adminBanUser: async (userId: string, ban: boolean): Promise<void> => {
     await supabase.from('profiles').update({ banned: ban }).eq('id', userId);
  },

  adminResolveReport: async (reportId: string, action: 'DISMISS' | 'DELETE_ITEM', itemId?: string): Promise<void> => {
     if (action === 'DELETE_ITEM' && itemId) {
        await api.deleteItem(itemId);
     }
     await supabase.from('reports').update({ status: 'RESOLVED' }).eq('id', reportId);
  },

  subscribeToAdminEvents: (callback: () => void) => {
     return supabase.channel('admin-dashboard')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, callback)
       .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callback)
       .subscribe();
  },

  // --- WALLET ---

  getWalletHistory: async (userId: string): Promise<{credits: any[], debits: any[]}> => {
     const { data: credits } = await supabase.from('transactions').select('*, item:items(title)').eq('seller_id', userId);
     const { data: debits } = await supabase.from('transactions').select('*, item:items(title)').eq('buyer_id', userId);
     return { credits: credits || [], debits: debits || [] };
  },

  getBankAccounts: async (userId: string): Promise<BankAccount[]> => {
     const { data } = await supabase.from('bank_accounts').select('*').eq('user_id', userId);
     return data?.map((b: any) => ({
        id: b.id,
        bankName: b.bank_name,
        last4: b.last4,
        holderName: b.holder_name
     })) || [];
  },

  addBankAccount: async (userId: string, bank: Partial<BankAccount>): Promise<void> => {
     await supabase.from('bank_accounts').insert({
        user_id: userId,
        bank_name: bank.bankName,
        last4: bank.last4,
        holder_name: bank.holderName
     });
  },

  deleteBankAccount: async (id: string): Promise<void> => {
     await supabase.from('bank_accounts').delete().eq('id', id);
  },

  withdrawFunds: async (userId: string, amount: number): Promise<void> => {
     const { error } = await supabase.rpc('withdraw_funds', { p_user_id: userId, p_amount: amount });
     if (error) throw error;
  },

  deleteAccount: async (userId: string): Promise<void> => {
     await supabase.from('profiles').delete().eq('id', userId);
     await supabase.auth.signOut();
  }
};