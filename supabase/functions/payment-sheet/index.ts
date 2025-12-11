
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0'

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const { amount, currency = 'usd' } = await req.json()

    // 1. Calculate Application Fee (e.g., 5% Platform Fee)
    // We assume the amount passed is the TOTAL the buyer pays (Item + Fee).
    // In a real Connect scenario, you would specify `transfer_data` to the seller's connected account.
    // For this standard integration, we just capture the payment.
    
    // Application Fee Calculation (Example: 5% of total)
    // const appFee = Math.round(amount * 0.05);

    // 2. Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: currency,
      automatic_payment_methods: { enabled: true },
      metadata: { 
        integration_check: 'accept_a_payment',
        service: 'Seconds App'
      }
    })

    // Return the client secret to the frontend
    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id 
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
        } 
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
