
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0'

// Declare Deno global
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
    const { userId, amount, destinationAccountId } = await req.json()

    // 1. Validation (In prod, verify user balance from DB again here for security)
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    // 2. Execute Transfer
    // NOTE: In a real Connect setup, you need the user's 'connected account ID' (destinationAccountId).
    // For this MVP, we simulate the success if no connected account is provided, 
    // or attempt a transfer if one is provided.

    let transferResult;

    if (destinationAccountId) {
        // Real Stripe Connect Transfer
        transferResult = await stripe.transfers.create({
            amount: amount,
            currency: "usd",
            destination: destinationAccountId,
        });
    } else {
        // Simulation for MVP (Since we don't have a full onboarding flow for Connect Accounts in the UI)
        console.log(`[MOCK PAYOUT] Sending $${amount/100} to User ${userId}`);
        transferResult = { id: `tr_mock_${Date.now()}`, status: 'paid' };
    }

    return new Response(
      JSON.stringify({ success: true, transfer: transferResult }),
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
