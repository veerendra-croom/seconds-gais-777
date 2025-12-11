
# Seconds - Campus Marketplace

This is a production-ready Progressive Web App (PWA) built with React, Vite, and Supabase.

## 🚀 Getting Started

### 1. Database Setup
1. Create a new project at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase_schema.sql` (found in the root) and run it. This will create all necessary tables, functions, and security policies.
4. Go to **Storage**, create TWO public buckets:
   - `items`
   - `verifications`

### 2. Environment Variables
Create a `.env` file in the root directory (or configure in your hosting provider):

```env
# Gemini AI (Get key from aistudio.google.com)
API_KEY=your_gemini_api_key

# Supabase (Get from Project Settings -> API)
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

*Note: In `services/supabaseClient.ts`, placeholders are currently used. Replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your actual project credentials.*

### 3. Edge Functions (Optional for Payments/Emails)
Refer to `SUPABASE_EDGE_FUNCTIONS.md` to deploy the backend logic for:
- Stripe Payment Intents
- Transactional Emails (Resend/SendGrid)

### 4. Deployment
This project is optimized for **Vercel** or **Netlify**.
1. Connect your repository.
2. Add the environment variables in the deployment settings.
3. Deploy!

## 📱 PWA Features
- The app is installable on iOS and Android.
- `manifest.json` handles the app icon and splash screen configuration.
- `sw.js` (Service Worker) handles offline caching and push notifications.

## 🛠 Admin Access
To become an admin:
1. Sign up as a new user.
2. Select "I'm an Admin".
3. Use the code: `SECONDS2024` (Configurable in the `app_config` table).
