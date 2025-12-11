
# Seconds-App Architecture Documentation

## 1. Executive Summary
**Seconds** is a Progressive Web Application (PWA) designed as a hyper-local, secure marketplace for university students. It facilitates the buying, selling, renting, and swapping of goods and services within a verified campus ecosystem. The architecture prioritizes security (via student ID verification), sustainability (carbon footprint tracking), and ease of use (AI-assisted listings and interactions).

## 2. High-Level System Design

The platform follows a **Serverless / BaaS (Backend-as-a-Service)** architecture, minimizing operational overhead while maximizing scalability and realtime capabilities.

### 2.1 Core Components
1.  **Frontend (Client)**: A React-based Single Page Application (SPA) wrapped as a PWA.
2.  **Backend & Database**: Supabase (PostgreSQL) handles data persistence, authentication, and realtime subscriptions.
3.  **Edge Logic**: Deno-based Edge Functions handle sensitive third-party integrations (Stripe, Email).
4.  **AI Layer**: Google Gemini API provides intelligence for content generation, image analysis, and safety checks.
5.  **Storage**: Object storage for user-generated content (images).

### 2.2 Architecture Diagram

```mermaid
graph TD
    Client[Client PWA (React/Vite)]
    
    subgraph "Supabase (BaaS)"
        Auth[GoTrue Auth]
        DB[(PostgreSQL DB)]
        Realtime[Realtime Engine]
        Storage[Object Storage]
        Edge[Edge Functions]
    end
    
    subgraph "External Services"
        Gemini[Google Gemini API]
        Stripe[Stripe Payments]
        Resend[Resend Email API]
        Map[OpenStreetMap / Nominatim]
    end

    Client -->|HTTPS/REST| Edge
    Client -->|WebSocket| Realtime
    Client -->|PostgREST| DB
    Client -->|SDK| Auth
    Client -->|Direct Upload| Storage
    Client -->|AI Analysis| Gemini
    Client -->|Geocoding| Map

    Edge -->|Payment Intent| Stripe
    Edge -->|Transactional Email| Resend
    Edge -->|Webhooks| DB
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | Component-based UI, fast build tool. |
| **Language** | TypeScript | Type safety and code maintainability. |
| **Styling** | Tailwind CSS | Utility-first styling for responsive design. |
| **Database** | PostgreSQL (Supabase) | Relational data, Row Level Security (RLS). |
| **Authentication** | Supabase Auth | User management, Session handling. |
| **AI / ML** | Google Gemini (2.5 Flash) | Image analysis, price estimation, smart replies, moderation. |
| **Realtime** | Supabase Realtime | Live chat, order status updates, notifications. |
| **Payments** | Stripe Connect (Simulated) | Escrow-style payment flows. |
| **Maps** | Leaflet + OpenStreetMap | Visualizing safe trade zones. |
| **Deployment** | Vercel / Netlify | Static asset hosting and Edge Function execution. |

---

## 4. Data Model (Schema)

The database is normalized and relies heavily on foreign keys and RLS policies for security.

### Core Entities

*   **Profiles**: Extends Auth User. Stores university info, verification status, earnings, and reputation badges.
*   **Colleges**: Whitelist of supported universities with geolocation data.
*   **Items**: Products or services listed. Includes polymorphic types (`SALE`, `RENT`, `SERVICE`, `SWAP`).
*   **Transactions**: Records financial exchanges. Operates on an **Escrow** model (PENDING -> COMPLETED).
*   **Messages**: 1:1 chat messages between users, linked to specific Items for context.
*   **Notifications**: System and user-triggered alerts.
*   **Reviews**: Reputation system consisting of ratings, comments, and trust tags.
*   **VerificationCodes**: OTPs for `.edu` email verification.

### Key Relationships
*   `Items` belong to `Profiles` (Seller).
*   `Transactions` link `Buyer`, `Seller`, and `Item`.
*   `Messages` link `Sender`, `Receiver`, and optional `Item`.

---

## 5. Key Workflows

### 5.1 Authentication & Verification
1.  **Sign Up**: User creates account via Supabase Auth.
2.  **Profile Creation**: A `Profile` row is created.
3.  **Student Verification**:
    *   User enters `.edu` email.
    *   Edge Function sends OTP via Resend.
    *   User uploads Student ID image to secure Storage bucket.
    *   Admin reviews ID (manual or AI-assisted) to toggle `verified` flag.

### 5.2 Listing an Item (AI-Powered)
1.  **Capture**: User takes a photo.
2.  **Analyze**: Image is sent to **Gemini 2.5 Flash**.
    *   *Prompt*: "Identify item, category, condition, and estimated price."
3.  **Auto-Fill**: Form fields (Title, Description, Price) are populated automatically.
4.  **Refine**: User edits details.
5.  **Publish**: Item is saved to DB. `handle_new_item` trigger may notify relevant users.

### 5.3 Purchasing (Escrow Model)
1.  **Initiate**: Buyer clicks "Buy Now".
2.  **Payment**: 
    *   Client calls `payment-sheet` Edge Function.
    *   Stripe PaymentIntent created.
    *   Client confirms payment.
3.  **Hold**: Transaction created with status `PENDING`. Funds are virtually held.
4.  **Handover**:
    *   Buyer receives a **QR Code**.
    *   Seller receives a **Scanner**.
5.  **Release**:
    *   Users meet. Seller scans Buyer's QR code.
    *   Client calls `confirmOrder` RPC.
    *   Transaction becomes `COMPLETED`. Funds move to Seller's internal wallet.

### 5.4 Realtime Chat
1.  **Subscription**: Client subscribes to `messages` table filtered by `receiver_id`.
2.  **Sending**: Message inserted into DB.
3.  **Delivery**: Supabase Realtime pushes payload to receiver instantly.
4.  **Smart Replies**: Client uses Gemini to analyze conversation history and suggest next responses (e.g., "Where can we meet?", "Is the price negotiable?").

---

## 6. Security Architecture

### 6.1 Row Level Security (RLS)
Database security is enforced at the engine level.
*   **Public Read**: Items (Active), Profiles (Public info).
*   **Private Write**: Users can only edit their own Items/Profiles.
*   **Strict Privacy**: `Transactions`, `Messages`, and `VerificationCodes` are strictly siloed to the involved participants.

### 6.2 Content Safety
*   **Image Moderation**: Before upload, images are sent to Gemini to check for prohibited content (weapons, explicit material).
*   **Text Moderation**: Admin dashboard allows flagging and removal of inappropriate listings.

### 6.3 Financial Security
*   **No Direct P2P**: Funds are not transferred directly to bank accounts immediately.
*   **Ledger System**: Internal `earnings` column tracks balance.
*   **Withdrawal Gate**: Payouts require an explicit Edge Function call to Stripe Connect, preventing client-side manipulation of funds.

---

## 7. Directory Structure

```text
/
├── src/
│   ├── components/       # Reusable UI (ItemCard, Modals, Maps)
│   ├── services/         # API Clients (Supabase, Gemini)
│   ├── views/            # Page-level components
│   ├── types.ts          # TypeScript interfaces
│   ├── App.tsx           # Main Router & State
│   └── main.tsx          # Entry point
├── supabase/
│   └── functions/        # Edge Functions (Deno)
│       ├── payment-sheet/
│       ├── send-email/
│       └── push-notification/
├── public/               # Static assets & Manifest
├── index.html            # HTML Shell
└── architecture.md       # This file
```

## 8. Future Scalability
*   **Search**: Currently uses PostgreSQL `pg_trgm` (fuzzy search). Can upgrade to `pgvector` for semantic search using Gemini embeddings.
*   **Notifications**: Currently uses browser Notification API via Service Worker. Can integrate FCM (Firebase Cloud Messaging) for more robust mobile push.
*   **Admin**: The current Admin Dashboard is built into the app. Ideally, this would be separated into a distinct internal tool.
