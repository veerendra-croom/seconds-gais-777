# Database Architecture Overview

## 1. Introduction
**Seconds-App** is built on a Serverless / Backend-as-a-Service (BaaS) architecture using **Supabase** (PostgreSQL). The database is not just a passive store; it actively handles authentication, authorization (via RLS), and real-time state synchronization for the frontend.

## 2. Core Design Principles

### A. User-Centric & Relational
The schema is highly normalized around the `profiles` table.
*   **Identity**: The `profiles` table references `auth.users` 1:1. This separates authentication credentials (handled by Supabase Auth) from application data (handled by PostgreSQL).
*   **Foreign Keys**: Strict foreign key constraints ensure data integrity. Deleting a user cascades to their sensitive data (like messages) while preserving transaction history where necessary.

### B. Security via Row Level Security (RLS)
Security is enforced at the database engine level, not the application server.
*   **Public Access**: Items marked `ACTIVE` and `colleges` are readable by anyone (including guests/unauthenticated users in some contexts).
*   **Private Access**: `messages`, `transactions`, and `notifications` are strictly siloed. A user can *only* select rows where their User ID appears in specific columns (e.g., `sender_id`, `buyer_id`).
*   **Admin Access**: Specific policies allow users with `role = 'ADMIN'` to bypass standard restrictions for moderation purposes (viewing reports, verifying IDs).

### C. Escrow Financial Model
To ensure trust in a P2P marketplace, the database enforces an Escrow state machine:
1.  **Pending**: Money is authorized via Stripe (Edge Function) and recorded in `transactions`. Funds are *not* added to the seller's wallet yet.
2.  **Verification**: A `meetup_code` is generated on the server side.
3.  **Completion**: The `complete_order` RPC function verifies the code and atomically moves funds to the seller's `profiles.earnings` column.
4.  **Withdrawal**: The `withdraw_funds` RPC ensures the user has a sufficient balance before triggering a Stripe Connect payout.

### D. Realtime Synchronization
The React frontend subscribes to PostgreSQL changes via WebSockets (Supabase Realtime) for:
*   **Messaging**: Instant delivery of chat messages (`messages` table).
*   **Order Status**: Live updates when a seller scans a QR code (`transactions` table).
*   **Notifications**: Pushing system alerts (`notifications` table).

## 3. High-Level Entity Map

| Entity | Description | Key Relationships |
| :--- | :--- | :--- |
| **Profiles** | Extended user data (College, Verification, Wallet) | `auth.users`, `Colleges` |
| **Items** | The central inventory (Goods, Services, Requests) | Belongs to `Seller` |
| **Transactions** | Financial ledger for Purchases | Links `Buyer`, `Seller`, `Item` |
| **Bookings** | Time-based reservations for Services | Links `Booker`, `Provider` |
| **SwapProposals** | Barter system logic | Links `Initiator`, `Receiver`, 2 Items |
| **Messages** | Chat history with context | Links `Sender`, `Receiver`, `Item` |
| **Reviews** | Reputation system | Links `Reviewer`, `Target` |
| **Reports** | Moderation queue | Links `Reporter`, `Item` |
| **Devices** | Push Notification subscriptions | Belongs to `User` |

## 4. Performance & Scalability
*   **Search**: We utilize `pg_trgm` (PostgreSQL Trigram extension) for fuzzy searching item titles and descriptions.
*   **Indexing**: Foreign keys (`seller_id`, `item_id`) and status columns are indexed for fast filtering.
*   **Storage**: Images are stored in Supabase Storage buckets (`items`, `verifications`), with only the public URLs stored in the database.
