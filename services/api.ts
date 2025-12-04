
import { supabase } from './supabaseClient';
import { Item, UserProfile, Category, Message, Conversation, Transaction, Booking, SwapProposal, Review, Report, Notification, College } from '../types';

// Helper to parse image column which might be a single URL string or a JSON array string
const parseImages = (imgStr: string | null): string[] => {
  if (!imgStr) return [];
  try {
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
  // --- CONFIG & COLLEGES ---
  getColleges: async (): Promise<College[]> => {
    const { data, error } = await supabase.from('colleges').select('*').order('name');
    if (error) {
      console.error("Failed to fetch colleges", error);
      return [];
    }
    return data as College[];
  },

  // --- AUTH & PROFILE ---
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

    // Check ban status immediately
    if (data.banned) {
      await supabase.auth.signOut();
      throw new Error("This account has been suspended.");
    }

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
        college_email_verified: false,
        banned: false
      });
    if (error) { console.error("Failed to create profile", error); throw error; }
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.full_name = updates.name;
    if (updates.avatar) dbUpdates.avatar_url = updates.avatar;
    if (updates.college) dbUpdates.college = updates.college;

    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (error) throw error;
  },

  linkCollegeEmail: async (userId: string, collegeEmail: string) => {
    // In production, this would trigger an SMTP email via Edge Function
    // For now, we update directly
    const { error } = await supabase.from('profiles').update({ college_email: collegeEmail, college_email_verified: true }).eq('id', userId);
    if (error) throw error;
  },

  checkAdminCode: async (code: string): Promise<boolean> => {
    const { data, error } = await supabase.from('app_config').select('value').eq('key', 'admin_signup_code').maybeSingle();
    if (data) return data.value === code;
    return false;
  },

  updateAdminCode: async (newCode: string) => {
    const { error } = await supabase.from('app_config').upsert({ key: 'admin_signup_code', value: newCode });
    if (error) throw error;
  },

  deleteAccount: async (userId: string) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) throw error;
    await supabase.auth.signOut();
  },

  // --- BLOCKING LOGIC ---
  blockUser: async (blockerId: string, blockedId: string) => {
    const { error } = await supabase.from('blocked_users').insert({
      blocker_id: blockerId,
      blocked_id: blockedId
    });
    // Ignore error if already blocked (unique constraint)
    if (error && !error.message.includes("unique")) throw error;
  },

  checkIsBlocked: async (userId: string, otherUserId: string): Promise<boolean> => {
    const { data } = await supabase.from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${userId})`)
      .maybeSingle();
    return !!data;
  },

  // --- ADMIN FUNCTIONALITY ---

  subscribeToAdminEvents: (callback: () => void) => {
    const channel = supabase.channel('admin-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, callback)
      .subscribe();
    
    return channel;
  },

  adminGetPendingVerifications: async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('college_email_verified', true).eq('verified', false).eq('role', 'STUDENT');
    if (error) return [];
    return data;
  },

  adminVerifyUser: async (userId: string, approve: boolean) => {
    const { error } = await supabase.from('profiles').update({ verified: approve }).eq('id', userId);
    if (error) throw error;

    if (approve) {
      await api.createNotification({
        userId,
        type: 'SYSTEM',
        title: 'You are Verified! 🎉',
        message: 'Your student ID has been approved. You now have full access to Seconds.',
        link: 'PROFILE'
      });
    }
  },

  adminGetVerificationImage: async (userId: string): Promise<string | null> => {
    const { data: list } = await supabase.storage.from('verifications').list('', { search: userId });
    
    if (list && list.length > 0) {
      // Sort by creation time desc
      const sorted = list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const file = sorted[0];
      const { data } = await supabase.storage.from('verifications').createSignedUrl(file.name, 3600); 
      return data?.signedUrl || null;
    }
    return null;
  },

  adminGetAllUsers: async (page: number = 0, limit: number = 20, searchQuery: string = '') => {
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const from = page * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, to);
    
    if (error) return { users: [], count: 0 };
    return { users: data, count: count || 0 };
  },

  adminBanUser: async (userId: string, ban: boolean) => {
    const { error } = await supabase.from('profiles').update({ banned: ban }).eq('id', userId);
    if (error) throw error;
  },

  adminGetStats: async () => {
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: itemCount } = await supabase.from('items').select('*', { count: 'exact', head: true });
    // Calculate real GMV from transactions
    const { data: transactions } = await supabase.from('transactions').select('amount').eq('status', 'COMPLETED');
    const gmv = transactions ? transactions.reduce((sum, t) => sum + (t.amount || 0), 0) : 0;

    return { users: userCount || 0, items: itemCount || 0, gmv: gmv };
  },

  adminGetAnalytics: async () => {
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 7);
    const dateStr = sinceDate.toISOString();

    const { data: newUsers } = await supabase.from('profiles').select('created_at').gte('created_at', dateStr);
    const { data: newSales } = await supabase.from('transactions').select('created_at, amount').gte('created_at', dateStr);
    const { data: items } = await supabase.from('items').select('category');

    const chartData = days.map(day => {
      const dayUsers = newUsers?.filter(u => u.created_at.startsWith(day)).length || 0;
      const daySales = newSales?.filter(s => s.created_at.startsWith(day)).reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
      return {
        name: day.split('-').slice(1).join('/'),
        users: dayUsers,
        sales: daySales
      };
    });

    const catMap: Record<string, number> = {};
    items?.forEach(i => {
      catMap[i.category] = (catMap[i.category] || 0) + 1;
    });
    const categoryData = Object.keys(catMap).map(key => ({ name: key, value: catMap[key] }));

    return { chartData, categoryData };
  },

  // --- ITEMS ---
  getItems: async (type: string, category: string | 'All', searchQuery?: string, maxPrice?: number, page: number = 0, limit: number = 12): Promise<Item[]> => {
    let query = supabase.from('items').select(`*, profiles:seller_id (full_name, college, verified, banned)`).eq('status', 'ACTIVE');
    let dbType = type;
    if (type === 'BUY') dbType = 'SALE';
    if (type === 'EARN') dbType = 'SERVICE';
    
    if (['SALE', 'RENT', 'SWAP', 'SERVICE', 'REQUEST'].includes(dbType)) {
      query = query.eq('type', dbType);
    }
    
    if (category !== 'All') query = query.eq('category', category);

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    if (maxPrice && maxPrice > 0) {
      query = query.lte('price', maxPrice);
    }

    // Explicitly exclude items from banned users
    query = query.is('profiles.banned', false);

    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await query.order('created_at', { ascending: false }).range(from, to);
    
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

  getUserItems: async (userId: string): Promise<Item[]> => {
    const { data, error } = await supabase.from('items').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
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
    const { data, error } = await supabase.from('items').select(`*, profiles:seller_id (full_name, college, verified, banned)`).eq('status', 'ACTIVE').order('created_at', { ascending: false }).limit(4);
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
          sellerName: item.profiles?.full_name || 'Unknown User',
          college: item.college,
          verified: item.profiles?.verified || false,
          rating: item.rating,
          description: item.description,
          status: item.status
        };
      });
  },

  // --- WISHLIST ---
  toggleSavedItem: async (userId: string, itemId: string) => {
    const { data } = await supabase.from('saved_items').select('id').eq('user_id', userId).eq('item_id', itemId).maybeSingle();
    if (data) {
      await supabase.from('saved_items').delete().eq('id', data.id);
      return false;
    } else {
      await supabase.from('saved_items').insert({ user_id: userId, item_id: itemId });
      return true;
    }
  },

  checkIsSaved: async (userId: string, itemId: string) => {
    const { data } = await supabase.from('saved_items').select('id').eq('user_id', userId).eq('item_id', itemId).maybeSingle();
    return !!data;
  },

  getSavedItems: async (userId: string): Promise<Item[]> => {
    const { data, error } = await supabase.from('saved_items').select(`item:item_id (*, profiles:seller_id (full_name, college, verified))`).eq('user_id', userId).order('created_at', { ascending: false });
    if (error) return [];
    return data.map((row: any) => {
      const item = row.item;
      if (!item) return null;
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
    }).filter(Boolean) as Item[];
  },

  uploadImage: async (file: File): Promise<string | null> => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Upload timed out after 10s")), 10000));
      
      const uploadPromise = (async () => {
        const fileExt = file.name.split('.').pop();
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const fileName = `${Date.now()}_${cleanFileName}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error } = await supabase.storage.from('items').upload(filePath, file, { upsert: false });
        
        if (error) {
           console.error("Supabase Storage Error Details:", JSON.stringify(error));
           throw error; 
        }
        
        const { data } = supabase.storage.from('items').getPublicUrl(filePath);
        return data.publicUrl;
      })();

      const result = await Promise.race([uploadPromise, timeoutPromise]);
      return result as string;
    } catch (error: any) {
      console.error("Upload Image Failed:", error);
      return null;
    }
  },

  createItem: async (item: Omit<Item, 'id' | 'sellerName' | 'verified' | 'rating' | 'college' | 'status'> & { status?: string, images: string[] }, userId: string, college: string) => {
    const imagePayload = item.images.length > 0 ? JSON.stringify(item.images) : null;
    const { data, error } = await supabase.from('items').insert({
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
    }).select().single();
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

  // --- MESSAGING ---
  sendMessage: async (senderId: string, receiverId: string, content: string, itemId?: string) => {
    const { data, error } = await supabase.from('messages').insert({ sender_id: senderId, receiver_id: receiverId, content: content, item_id: itemId }).select().single();
    if (error) throw error;
    return data;
  },

  getMessages: async (currentUserId: string, otherUserId: string, itemId?: string) => {
    // Check block status first
    const isBlocked = await api.checkIsBlocked(currentUserId, otherUserId);
    if (isBlocked) return [];

    let query = supabase.from('messages').select('*').or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`).order('created_at', { ascending: true });
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
    return supabase.channel('public:messages').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` }, async (payload) => {
        const msg = payload.new;
        // Verify block status on realtime event
        const isBlocked = await api.checkIsBlocked(userId, msg.sender_id);
        if (!isBlocked) {
          callback({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            itemId: msg.item_id,
            content: msg.content,
            createdAt: msg.created_at,
            isRead: msg.is_read
          });
        }
    }).subscribe();
  },

  getConversations: async (userId: string): Promise<Conversation[]> => {
    const { data: messages, error } = await supabase.from('messages').select(`*, sender:sender_id (full_name, avatar_url), receiver:receiver_id (full_name, avatar_url), item:item_id (title, image)`).or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false });
    if (error) return [];
    
    const { data: blocks } = await supabase.from('blocked_users').select('*').or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const blockedIds = blocks ? blocks.map((b: any) => b.blocker_id === userId ? b.blocked_id : b.blocker_id) : [];

    const conversationsMap = new Map<string, Conversation>();
    messages.forEach((msg: any) => {
      const isSender = msg.sender_id === userId;
      const partnerId = isSender ? msg.receiver_id : msg.sender_id;
      
      if (blockedIds.includes(partnerId)) return;

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

  // --- TRANSACTIONS & OFFERS ---
  createTransaction: async (data: Partial<Transaction>) => {
    const { error } = await supabase.rpc('create_order', {
       p_buyer_id: data.buyerId,
       p_seller_id: data.sellerId,
       p_item_id: data.itemId,
       p_amount: data.amount
    });
    if (error) throw error;
  },

  confirmOrder: async (txnId: string, buyerId: string) => {
    const { error } = await supabase.rpc('complete_order', {
      p_txn_id: txnId,
      p_user_id: buyerId
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

  createSwapProposal: async (data: Partial<SwapProposal>) => {
    const { error } = await supabase.from('swap_proposals').insert({
      initiator_id: data.initiatorId,
      receiver_id: data.receiverId,
      target_item_id: data.targetItemId,
      offered_item_id: data.offeredItemId,
      status: 'PENDING'
    });
    if (error) throw error;
  },

  getIncomingOffers: async (userId: string) => {
    const { data } = await supabase.from('swap_proposals')
      .select('*, initiator:initiator_id(full_name, avatar_url), targetItem:target_item_id(*), offeredItem:offered_item_id(*)')
      .eq('receiver_id', userId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });
    return data || [];
  },

  respondToProposal: async (proposalId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const { error } = await supabase.from('swap_proposals').update({ status }).eq('id', proposalId);
    if (error) throw error;
    
    // If accepted, maybe we want to notify or auto-chat
    if (status === 'ACCEPTED') {
       // Logic to mark item as swapped could go here, or handled manually by users
    }
  },

  getUserOrders: async (userId: string) => {
    const { data: purchases } = await supabase.from('transactions').select('*, item:item_id(*)').eq('buyer_id', userId).order('created_at', { ascending: false });
    const { data: bookings } = await supabase.from('bookings').select('*, service:service_id(*)').eq('booker_id', userId).order('created_at', { ascending: false });
    const { data: swaps } = await supabase.from('swap_proposals').select('*, targetItem:target_item_id(*), offeredItem:offered_item_id(*)').eq('initiator_id', userId).order('created_at', { ascending: false });
    return {
      purchases: purchases || [],
      bookings: bookings || [],
      swaps: swaps || []
    };
  },

  getWalletHistory: async (userId: string) => {
     const { data: sales } = await supabase.from('transactions').select('*, item:item_id(*)').eq('seller_id', userId).order('created_at', { ascending: false });
     const { data: providedServices } = await supabase.from('bookings').select('*, service:service_id(*)').eq('provider_id', userId).eq('status', 'COMPLETED').order('created_at', { ascending: false });
     const { data: purchases } = await supabase.from('transactions').select('*, item:item_id(*)').eq('buyer_id', userId).order('created_at', { ascending: false });
     return {
        credits: [...(sales || []), ...(providedServices || [])],
        debits: purchases || []
     };
  },

  withdrawFunds: async (userId: string, amount: number) => {
    const { error } = await supabase.rpc('withdraw_funds', {
      p_user_id: userId,
      p_amount: amount
    });
    if (error) throw error;
  },

  // --- REVIEWS & REPORTS ---
  getReviews: async (targetUserId: string): Promise<Review[]> => {
    const { data, error } = await supabase.from('reviews').select('*, reviewer:reviewer_id(full_name, avatar_url)').eq('target_user_id', targetUserId).order('created_at', { ascending: false });
    if (error) return [];
    return data.map((r: any) => ({
      id: r.id,
      reviewerId: r.reviewer_id,
      targetUserId: r.target_user_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      reviewerName: r.reviewer?.full_name || 'Student',
      reviewerAvatar: r.reviewer?.avatar_url
    }));
  },

  createReview: async (review: { reviewerId: string, targetUserId: string, rating: number, comment: string }) => {
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: review.reviewerId,
      target_user_id: review.targetUserId,
      rating: review.rating,
      comment: review.comment
    });
    if (error) throw error;
  },

  createReport: async (report: { reporterId: string, itemId: string, reason: string }) => {
    const { error } = await supabase.from('reports').insert({
      reporter_id: report.reporterId,
      item_id: report.itemId === 'SUPPORT_TICKET' ? null : report.itemId,
      reason: report.reason
    });
    if (error) throw error;
  },

  adminGetReports: async (): Promise<Report[]> => {
    const { data, error } = await supabase.from('reports').select('*, item:item_id(*)').eq('status', 'PENDING');
    if (error) return [];
    return data;
  },

  adminResolveReport: async (reportId: string, action: 'DISMISS' | 'DELETE_ITEM', itemId?: string) => {
    if (action === 'DELETE_ITEM' && itemId) {
      await supabase.from('items').update({ status: 'ARCHIVED' }).eq('id', itemId);
      const { data: item } = await supabase.from('items').select('seller_id').eq('id', itemId).single();
      if (item) {
        await api.createNotification({
          userId: item.seller_id,
          type: 'ALERT',
          title: 'Item Removed ⚠️',
          message: 'Your item was removed for violating community guidelines.',
          link: 'PROFILE'
        });
      }
    }
    await supabase.from('reports').update({ status: 'RESOLVED' }).eq('id', reportId);
  },

  // --- NOTIFICATIONS ---
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
      link: n.link,
      createdAt: n.created_at
    }));
  },

  createNotification: async (notif: Partial<Notification>) => {
    const { error } = await supabase.from('notifications').insert({
      user_id: notif.userId,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      link: notif.link
    });
    if (error) console.error("Failed to send notification", error);
  },

  subscribeToNotifications: (userId: string, callback: (n: Notification) => void) => {
    return supabase.channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userId}` 
      }, (payload) => {
        const n = payload.new;
        callback({
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.is_read,
          link: n.link,
          createdAt: n.created_at
        });
      })
      .subscribe();
  }
};
