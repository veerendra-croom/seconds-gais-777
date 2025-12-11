
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const { receiver_id, content, sender_id } = await req.json()

    // 1. In a real app, you would fetch the user's Push Subscription object from a 'devices' table here.
    // const { data: devices } = await supabase.from('devices').select('subscription').eq('user_id', receiver_id);

    // 2. Use web-push or Firebase Admin to send the notification.
    
    // For this MVP, we log the event so the DB trigger succeeds.
    console.log(`[PUSH NOTIFICATION] To User ${receiver_id}: New Message from ${sender_id} - "${content.substring(0, 50)}..."`);

    return new Response(
      JSON.stringify({ success: true, message: "Notification queued" }),
      { 
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } 
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } 
      },
    )
  }
})
