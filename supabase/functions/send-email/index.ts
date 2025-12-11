
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
  email: string;
  code?: string;
  type: 'VERIFY' | 'WELCOME' | 'ALERT';
  message?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const { email, code, type, message }: EmailRequest = await req.json()

    let subject = "Update from Seconds"
    let html = ""

    if (type === 'VERIFY') {
      subject = "Verify your Student Status"
      html = `
        <div style="font-family: sans-serif; text-align: center;">
          <h1>Welcome to Seconds! ⚡️</h1>
          <p>Please verify your university email address to access the marketplace.</p>
          <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0ea5e9; margin: 0;">${code}</p>
          </div>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    } else if (type === 'ALERT') {
      subject = "Seconds: New Alert"
      html = `<p>${message}</p>`
    }

    // Only attempt fetch if API Key exists
    if (!RESEND_API_KEY) {
      console.log(`[MOCK EMAIL] To: ${email}, Subject: ${subject}, Content: ${code || message}`);
      return new Response(JSON.stringify({ success: true, mock: true }), {
        headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }
      });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Seconds App <onboarding@resend.dev>', // Update this to your verified domain in production
        to: email,
        subject: subject,
        html: html
      })
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), { 
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } 
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } 
    })
  }
})