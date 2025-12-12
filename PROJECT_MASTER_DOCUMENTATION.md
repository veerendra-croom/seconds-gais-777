
# SECONDS-APP: PROJECT MASTER DOCUMENTATION
**Version:** 1.0.0-Alpha  
**Date:** May 22, 2024  
**Status:** MVP Complete / Pre-Production  

---

## TABLE OF CONTENTS

1.  [Executive Summary](#1-executive-summary)
2.  [Product Vision & Scope](#2-product-vision--scope)
3.  [User Experience & Design System](#3-user-experience--design-system)
4.  [Functional Specifications](#4-functional-specifications)
5.  [Technical Architecture](#5-technical-architecture)
6.  [Database Schema & Security](#6-database-schema--security)
7.  [AI Integration (Gemini)](#7-ai-integration-gemini)
8.  [Implementation Status Report](#8-implementation-status-report)
9.  [Installation & Deployment](#9-installation--deployment)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. EXECUTIVE SUMMARY

**Seconds-App** is a hyper-local, secure marketplace application designed exclusively for university students. It addresses the critical trust deficit in peer-to-peer commerce by enforcing strict identity verification via university credentials (`.edu` emails and Student IDs).

Unlike generic platforms (Craigslist, Facebook Marketplace), Seconds creates a "walled garden" for each campus. It leverages Generative AI to remove friction from listing items and ensuring safety, while an escrow-style payment system guarantees financial security during face-to-face meetups.

**Key Value Propositions:**
*   **Trust:** 100% Verified Student Userbase.
*   **Safety:** AI-recommended "Safe Zones" for meetups.
*   **Speed:** "Snap & List" functionality using Visual AI.
*   **Sustainability:** Gamified eco-impact tracking.

---

## 2. PRODUCT VISION & SCOPE

### 2.1 Target Audience
*   **Primary:** Undergraduate and Graduate students living on or near campus.
*   **Secondary:** Faculty and Staff with valid `.edu` credentials.
*   **Admin:** Campus Ambassadors and Platform Moderators.

### 2.2 Core Modules
The application is divided into specific functional modules:
1.  **BUY:** Purchase goods (textbooks, electronics, furniture).
2.  **SELL:** List items for sale with AI assistance.
3.  **RENT:** Short-term rentals of gear (cameras, calculators).
4.  **SHARE:** Free or low-cost community sharing.
5.  **SWAP:** Barter system for trading goods without cash.
6.  **EARN:** Service marketplace (tutoring, moving help).
7.  **REQUEST:** "In Search Of" posts for specific needs.

---

## 3. USER EXPERIENCE & DESIGN SYSTEM

### 3.1 Design Philosophy
*   **Mobile-First:** Designed as a PWA (Progressive Web App) to feel native on iOS/Android.
*   **Glassmorphism:** Extensive use of `backdrop-blur`, translucency, and soft shadows to create a modern, premium feel.
*   **Feedback-Rich:** Every action (save, like, purchase) has immediate visual feedback (toasts, micro-animations).

### 3.2 Color Palette
*   **Primary (Sky Blue):** `#0ea5e9` - Used for primary actions, branding, and trust.
*   **Secondary (Slate):** `#0f172a` - Used for text, navigation bars, and contrast.
*   **Success (Emerald):** `#10b981` - Verified badges, completed orders.
*   **Alert (Rose/Red):** `#f43f5e` - Errors, dangerous actions, blocking.
*   **Accent (Indigo/Violet):** Used for AI features and premium gradients.

### 3.3 Typography
*   **Font Family:** `Inter`, sans-serif.
*   **Hierarchy:**
    *   Headings: Bold/Black weight, tight tracking.
    *   Body: Regular/Medium weight, relaxed leading for readability.
    *   Microcopy: Uppercase, bold, tracking-widest (labels, badges).

---

## 4. FUNCTIONAL SPECIFICATIONS

### 4.1 Authentication & Onboarding
*   **Sign Up:** Users register with email/password.
*   **Role Selection:** Users select "Student" or "Admin" (Admin requires a secure code).
*   **College Linking:** Users must verify a `.edu` email via OTP (One-Time Password).
*   **ID Verification:** Users upload a photo of their physical student ID. This is stored securely and reviewed by Admins.

### 4.2 Marketplace (Buy/Sell)
*   **Feed:** Infinite scrolling grid of items. Filters for Price, Category, and Distance.
*   **Smart Search:** Natural language processing parses queries like "cheap bike under $100" into structured API filters.
*   **Listing Creation:**
    *   **Image Analysis:** AI identifies the object in the photo to auto-fill Title and Category.
    *   **Price Suggestion:** AI searches the web for current market value to suggest a price range.
    *   **Description Gen:** AI writes a catchy description based on the image.

### 4.3 Transactions (Escrow Model)
1.  **Initiation:** Buyer pays via Stripe (credit card). Funds are captured but **held** in a platform escrow account. Status: `PENDING`.
2.  **Meetup:** Users agree on a location via chat.
3.  **Verification:** Buyer presents a dynamic QR Code. Seller scans it using the app.
4.  **Release:** Successful scan triggers an API call to release funds to the Seller's internal wallet. Status: `COMPLETED`.

### 4.4 Messaging
*   **Real-time:** Built on Supabase Realtime (WebSockets).
*   **Smart Replies:** Context-aware response suggestions (e.g., "Is this still available?") generated by AI.
*   **Safety Features:**
    *   **Meetup Proposals:** One-click suggestion of campus safe zones (Libraries, Police Stations).
    *   **Blocking/Reporting:** Immediate action against harassment.

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 Tech Stack
*   **Frontend:** React 18, TypeScript, Vite.
*   **Styling:** Tailwind CSS.
*   **Backend:** Supabase (PostgreSQL, GoTrue Auth, Realtime, Storage).
*   **Edge Logic:** Deno (Supabase Edge Functions).
*   **AI:** Google Gemini API (`gemini-2.5-flash`).
*   **Maps:** Leaflet + OpenStreetMap.

### 5.2 Application Data Flow
```mermaid
[User] -> [React Client]
[React Client] -> [Supabase Auth] (Login/Session)
[React Client] -> [PostgreSQL] (Data CRUD via RLS)
[React Client] -> [Gemini API] (Image Analysis/Chat)
[React Client] -> [Edge Functions] (Sensitive Ops: Payments, Email)
[Edge Functions] -> [Stripe] (Payment Processing)
[Edge Functions] -> [Resend] (Email Delivery)
```

### 5.3 Offline Capabilities
*   **Service Worker:** `sw.js` caches static assets (HTML, JS, CSS) and handles PWA installation.
*   **Graceful Degradation:** UI shows "Offline" banners and disables network-dependent features while allowing read-access to cached data (where applicable).

---

## 6. DATABASE SCHEMA & SECURITY

### 6.1 Core Tables
*   `profiles`: User data, earnings, verification status. Linked 1:1 with `auth.users`.
*   `items`: Goods/services listed. Includes Geo-coordinates.
*   `transactions`: Financial ledger linking Buyer, Seller, and Item.
*   `messages`: Chat history.
*   `colleges`: Whitelist of supported universities and their coordinates.
*   `reports`: Moderation queue.

### 6.2 Row Level Security (RLS)
The application relies on "Security at the Data Layer".
*   **Public:** `items` (Active status only), `colleges`.
*   **Private:** `messages` (Sender/Receiver only), `transactions` (Buyer/Seller only).
*   **Admin:** `reports`, `verification_codes`, `app_config` (Read/Write for role='ADMIN').

### 6.3 Storage Buckets
*   `items`: Publicly readable images for product listings.
*   `verifications`: **Private** bucket. Only uploadable by auth users, only readable by Admins.

---

## 7. AI INTEGRATION (GEMINI)

The app uses `@google/genai` sdk with `gemini-2.5-flash`.

| Feature | Function | Description |
| :--- | :--- | :--- |
| **Snap & List** | `analyzeImageForListing` | Vision model extracts title, category, and condition from photo. |
| **Price Guide** | `analyzePrice` | Search Grounding finds real-world prices on eBay/Mercari for comparison. |
| **Smart Search** | `parseSearchQuery` | NLP converts "laptop under 500" -> `{ query: 'laptop', maxPrice: 500 }`. |
| **Smart Replies** | `generateSmartReplies` | Generates 3 contextual chat responses based on message history. |
| **Safety Check** | `checkImageSafety` | Pre-screens uploads for prohibited content before storage. |
| **Eco Impact** | `analyzeSustainability` | Calculates CO2/Water savings for the "Impact" dashboard. |

---

## 8. IMPLEMENTATION STATUS REPORT

### ✅ Completed Features
*   **Authentication:** Login, Register, Forgot Password.
*   **Navigation:** Responsive Sidebar, Mobile Tab Bar, Routing.
*   **Marketplace:** Browse, Filter, Sort, View Details.
*   **Listing:** Create/Edit/Delete items with AI autofill.
*   **Chat:** Real-time messaging, Typing indicators, Smart Replies.
*   **Transactions:** UI for Buy/Sell flow, QR Code Generation, Scanning logic.
*   **Profile:** Stats, Badges, Wallet UI, Edit Profile.
*   **Admin Dashboard:** User table, Ban actions, Stats charts.
*   **Safety:** Verification UI, Safety Map, Report System.

### ⚠️ Partially Implemented / Mocked
*   **Payments:** The UI calls the `payment-sheet` Edge Function, but without a live Stripe Secret Key, it returns a mock success response for demo purposes.
*   **Emails:** The UI calls `send-email`, but requires a Resend API Key to actually deliver messages.
*   **Push Notifications:** Service Worker is registered, but VAPID keys need generation for production use.

### ❌ Pending / Future
*   **Semantic Search:** Using Vector Embeddings for "meaning-based" search.
*   **Auctions:** Bidding logic for high-ticket items.
*   **Delivery:** Integration with campus delivery services.

---

## 9. INSTALLATION & DEPLOYMENT

### 9.1 Prerequisites
*   Node.js v18+
*   NPM/Yarn
*   Supabase Account
*   Google AI Studio Key

### 9.2 Setup Steps
1.  **Clone Repo**: `git clone ...`
2.  **Install Deps**: `npm install`
3.  **Env Setup**: Create `.env` with `API_KEY` (Gemini) and Supabase credentials.
4.  **DB Init**: Run SQL scripts from `database/database_schemas.md` in Supabase SQL Editor.
5.  **Run**: `npm run dev`

### 9.3 Production Build
1.  `npm run build`
2.  Deploy `dist/` folder to Vercel/Netlify.
3.  Deploy Edge Functions via Supabase CLI: `supabase functions deploy`.

---

## 10. FUTURE ROADMAP

### Phase 2: Engagement (Q3 2024)
*   **Native App Wrapper:** Wrap PWA in Capacitor for App Store deployment.
*   **Community Feed:** A social-media style feed for "Looking For" requests and campus news.
*   **Referral System:** "Invite a Friend, Get $5 Credit".

### Phase 3: Expansion (Q4 2024)
*   **Multi-Campus:** Dynamic switching between universities based on `.edu` domain.
*   **Business Accounts:** Allow local campus businesses to list coupons/deals.
*   **Data API:** Public API for researchers to study campus economic flows.

---
*End of Document*
