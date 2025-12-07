
# Seconds - Campus Marketplace

This is a production-ready Progressive Web App (PWA) built with React, Vite, and Supabase.

## 🚀 Getting Started

### 1. Database Setup
1. Create a new project at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase_schema.sql` and run it. This will create all necessary tables and security policies.
4. Go to **Storage**, create a new public bucket named `items` and another named `verifications`.

### 2. Environment Variables
Create a `.env` file in the root directory (or configure in your hosting provider):

```env
# Gemini AI (Get key from aistudio.google.com)
API_KEY=your_gemini_api_key

# Supabase (Get from Project Settings -> API)
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

*Note: In the current code, `services/supabaseClient.ts` uses hardcoded placeholders. You must replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your actual credentials.*

### 3. Deployment
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
