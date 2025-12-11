
# SQL Queries & Database Reference

This document serves as a complete reference for the database schema (DDL), stored procedures (RPC), and the application-level queries (DML) used within the Seconds-App via the Supabase JS SDK.

---

## 1. Schema Initialization (DDL)

Run these commands in the Supabase SQL Editor to build the database structure.

### Extensions
```sql
-- Enable UUIDs for primary keys
create extension if not exists "uuid-ossp";
-- Enable Trigram for Fuzzy Search (Marketplace Search)
create extension if not exists "pg_trgm";
```

### Table Definitions

#### Profiles
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  college text,
  role text default 'STUDENT' check (role in ('STUDENT', 'ADMIN')),
  verified boolean default false,
  verification_status text default 'NONE',
  earnings numeric default 0,
  savings numeric default 0,
  bio text,
  social_links jsonb default '{}'::jsonb,
  college_email text,
  college_email_verified boolean default false,
  trusted_contacts text[] default array[]::text[],
  banned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.profiles enable row level security;
```

#### Items
```sql
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  price numeric default 0,
  original_price numeric,
  category text,
  type text check (type in ('SALE', 'RENT', 'SHARE', 'SWAP', 'SERVICE', 'REQUEST')),
  image text, 
  college text,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'SOLD', 'DRAFT', 'ARCHIVED')),
  rating numeric default 5.0,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
-- Search Index
create index items_title_idx on public.items using gin (title gin_trgm_ops);
alter table public.items enable row level security;
```

#### Transactions
```sql
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id),
  buyer_id uuid references public.profiles(id),
  seller_id uuid references public.profiles(id),
  amount numeric not null,
  status text default 'PENDING' check (status in ('PENDING', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
  meetup_code text default floor(random() * 899999 + 100000)::text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.transactions enable row level security;
```

#### Messages
```sql
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  item_id uuid references public.items(id),
  content text,
  image_url text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.messages enable row level security;
```

#### Ancillary Tables
*(Refer to `database_schemas.md` for full columns of these tables)*
*   `public.bookings` (Service reservations)
*   `public.swap_proposals` (Barter logic)
*   `public.notifications` (System alerts)
*   `public.reviews` (User ratings)
*   `public.reports` (Moderation queue)
*   `public.saved_items` (Watchlist)
*   `public.verification_codes` (OTP)
*   `public.bank_accounts` (Payout methods)
*   `public.blocked_users` (Privacy)
*   `public.app_config` (Admin settings)
*   `public.colleges` (University whitelist)
*   `public.devices` (Push tokens)

---

## 2. Stored Procedures (RPC)

These PL/PGSQL functions are called via `api.createTransaction`, `api.confirmOrder`, etc.

### `create_order`
**Used in:** `views/PurchaseModal.tsx` via `api.createTransaction`
```sql
create or replace function create_order(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_item_id uuid,
  p_amount numeric
)
returns void as $$
begin
  insert into public.transactions (buyer_id, seller_id, item_id, amount, status)
  values (p_buyer_id, p_seller_id, p_item_id, p_amount, 'PENDING');

  update public.items set status = 'SOLD' where id = p_item_id;

  insert into public.notifications (user_id, type, title, message, link)
  values (p_seller_id, 'ORDER', 'New Order Received', 'Someone bought your item!', 'MY_ORDERS');
end;
$$ language plpgsql security definer;
```

### `complete_order`
**Used in:** `views/OrderDetailView.tsx` (QR Scan) via `api.confirmOrder`
```sql
create or replace function complete_order(
  p_txn_id uuid,
  p_user_id uuid
)
returns void as $$
declare
  v_seller_id uuid;
  v_amount numeric;
begin
  select seller_id, amount into v_seller_id, v_amount
  from public.transactions
  where id = p_txn_id and buyer_id = p_user_id and status = 'PENDING';

  if v_seller_id is null then raise exception 'Unauthorized'; end if;

  update public.transactions set status = 'COMPLETED' where id = p_txn_id;
  update public.profiles set earnings = earnings + v_amount where id = v_seller_id;
  
  insert into public.notifications (user_id, type, title, message, link)
  values (v_seller_id, 'ORDER', 'Funds Released', 'Order completed.', 'PROFILE');
end;
$$ language plpgsql security definer;
```

### `withdraw_funds`
**Used in:** `views/WalletModal.tsx` via `api.withdrawFunds`
```sql
create or replace function withdraw_funds(
  p_user_id uuid,
  p_amount numeric
)
returns void as $$
declare v_balance numeric;
begin
  select earnings into v_balance from public.profiles where id = p_user_id;
  if v_balance < p_amount then raise exception 'Insufficient funds'; end if;
  update public.profiles set earnings = earnings - p_amount where id = p_user_id;
end;
$$ language plpgsql security definer;
```

---

## 3. Application Queries (DML)

These correspond to the Supabase JS SDK calls in `services/api.ts`.

### User & Profile
*   **Get Profile**:
    ```sql
    SELECT * FROM profiles WHERE id = 'user_uuid';
    ```
*   **Create Profile** (Auth Hook/Register):
    ```sql
    INSERT INTO profiles (id, email, full_name, college, role, avatar_url) VALUES (...);
    ```
*   **Update Profile**:
    ```sql
    UPDATE profiles SET full_name = ?, bio = ?, social_links = ? WHERE id = ?;
    ```

### Marketplace (Items)
*   **Get Feed** (Filtered & Sorted):
    ```sql
    SELECT *, profiles(full_name, college, verified) 
    FROM items 
    WHERE status = 'ACTIVE' 
      AND type = 'SALE' -- (or RENT, SERVICE, etc)
      AND title ILIKE '%search_term%'
      AND price BETWEEN ? AND ?
      AND college = 'UCLA'
    ORDER BY created_at DESC -- (or price ASC/DESC)
    LIMIT 12 OFFSET 0;
    ```
*   **Get Item Details**:
    ```sql
    SELECT *, profiles(...) FROM items WHERE id = 'item_uuid';
    ```
*   **Get User Inventory**:
    ```sql
    SELECT * FROM items WHERE seller_id = 'user_uuid' ORDER BY created_at DESC;
    ```

### Messaging
*   **Get Conversations List**:
    ```sql
    SELECT *, sender:profiles(...), receiver:profiles(...), item:items(title, image)
    FROM messages
    WHERE sender_id = 'me' OR receiver_id = 'me'
    ORDER BY created_at DESC;
    ```
    *(Note: The application does post-processing in JS to group these unique conversations).*

*   **Get Chat History**:
    ```sql
    SELECT * FROM messages 
    WHERE (sender_id = 'me' AND receiver_id = 'them') 
       OR (sender_id = 'them' AND receiver_id = 'me')
    ORDER BY created_at ASC;
    ```

### Admin Dashboard Queries
*   **Get Stats**:
    ```sql
    SELECT count(*) FROM profiles;
    SELECT count(*) FROM items;
    SELECT sum(amount) FROM transactions;
    ```
*   **Analytics** (Last 7 Days):
    ```sql
    SELECT amount, created_at FROM transactions WHERE created_at >= NOW() - INTERVAL '7 days';
    SELECT created_at FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days';
    ```
*   **Moderation Queue**:
    ```sql
    SELECT *, items(*) FROM reports WHERE status = 'PENDING';
    ```

### Security Policies (RLS) Logic
These are enforced automatically by Postgres for every query above.

*   **Items**: Anyone can `SELECT` active items. Only owner can `UPDATE/DELETE`.
*   **Messages**: Only `sender` or `receiver` can `SELECT`.
*   **Transactions**: Only `buyer` or `seller` can `SELECT`.
*   **Profiles**: Public read, owner write.
*   **Admin Tables**: Only users where `role = 'ADMIN'` can access `verification_codes` (read), `reports`, or sensitive `app_config`.
