
# Supabase Edge Functions Guide

These are the server-side functions you need to deploy to Supabase to make the app fully functional (Emails, Payments, Push Notifications).

## 1. Setup
Run `supabase functions new send-email` and `supabase functions new payment-sheet`.

## 2. Function: `send-email/index.ts`
*Use this with Resend.com (easier) or SendGrid.*

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { email, code, type } = await req.json()

  let subject = "Verify your Student Status"
  let html = `<p>Your verification code is: <strong>${code}</strong></p>`

  if (type === 'WELCOME') {
    subject = "Welcome to Seconds!"
    html = "<p>Thanks for joining the campus marketplace.</p>"
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Seconds App <onboarding@seconds.app>',
      to: email,
      subject: subject,
      html: html
    })
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
})
```

## 3. Function: `payment-sheet/index.ts`
*Use this to generate a Stripe Payment Intent.*

This file content is provided in `supabase/functions/payment-sheet/index.ts`.

**Deployment:**
1.  Set your Stripe Secret Key:
    ```bash
    supabase secrets set STRIPE_SECRET_KEY=sk_test_...
    ```
2.  Deploy the function:
    ```bash
    supabase functions deploy payment-sheet
    ```

## 4. Database Trigger (SQL)
*Run this in Supabase SQL Editor to trigger push notifications on new messages.*

```sql
create or replace function public.handle_new_message() 
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/push-notification', 
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}', 
    body := json_build_object(
      'receiver_id', new.receiver_id, 
      'content', new.content, 
      'sender_id', new.sender_id
    )::jsonb
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_new_message
  after insert on public.messages
  for each row execute procedure public.handle_new_message();
```
