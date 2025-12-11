
# Seconds App - Supabase Database Schema

Run the following SQL commands in your Supabase **SQL Editor** to initialize the database.

## 1. Enable Extensions
```sql
-- Enable UUID extension for unique IDs
create extension if not exists "uuid-ossp";
-- Enable Full Text Search
create extension if not exists "pg_trgm";
```

## 2. Enumerations & Types
*We use text constraints for simplicity and flexibility.*

## 3. Tables

### Profiles (Users)
```sql
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  college text,
  role text default 'STUDENT' check (role in ('STUDENT', 'ADMIN')),
  verified boolean default false,
  verification_status text default 'NONE', -- NONE, PENDING, VERIFIED, REJECTED
  earnings numeric default 0,
  savings numeric default 0,
  bio text,
  social_links jsonb default '{}'::jsonb, -- {instagram, linkedin, website}
  college_email text,
  college_email_verified boolean default false,
  trusted_contacts text[] default array[]::text[],
  banned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Secure the table
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );
```

### Colleges
```sql
create table public.colleges (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  domain text not null, -- e.g., 'ucla.edu'
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed some data
insert into public.colleges (name, domain, latitude, longitude) values 
('UCLA', 'ucla.edu', 34.0689, -118.4452),
('USC', 'usc.edu', 34.0224, -118.2851),
('NYU', 'nyu.edu', 40.7295, -73.9965);

alter table public.colleges enable row level security;
create policy "Colleges are viewable by everyone" on public.colleges for select using (true);
create policy "Admins can manage colleges" on public.colleges for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
```

### Items (Listings)
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
  image text, -- Primary image (deprecated in favor of JSON array, kept for legacy)
  college text,
  status text default 'ACTIVE' check (status in ('ACTIVE', 'SOLD', 'DRAFT', 'ARCHIVED')),
  rating numeric default 5.0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Search
create index items_title_idx on public.items using gin (title gin_trgm_ops);

alter table public.items enable row level security;

create policy "Active items are viewable by everyone"
  on public.items for select
  using ( status = 'ACTIVE' or auth.uid() = seller_id );

create policy "Users can insert their own items"
  on public.items for insert
  with check ( auth.uid() = seller_id );

create policy "Users can update their own items"
  on public.items for update
  using ( auth.uid() = seller_id );

create policy "Users can delete their own items"
  on public.items for delete
  using ( auth.uid() = seller_id );
```

### Transactions (Orders & Escrow)
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

create policy "Users can see their own transactions"
  on public.transactions for select
  using ( auth.uid() = buyer_id or auth.uid() = seller_id );
```

### Bookings (Services)
```sql
create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  service_id uuid references public.items(id),
  booker_id uuid references public.profiles(id),
  provider_id uuid references public.profiles(id),
  booking_date timestamp with time zone,
  status text default 'REQUESTED' check (status in ('REQUESTED', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.bookings enable row level security;

create policy "Users can see their bookings"
  on public.bookings for select
  using ( auth.uid() = booker_id or auth.uid() = provider_id );

create policy "Users can create bookings"
  on public.bookings for insert
  with check ( auth.uid() = booker_id );
  
create policy "Users can update their bookings"
  on public.bookings for update
  using ( auth.uid() = booker_id or auth.uid() = provider_id );
```

### Swap Proposals
```sql
create table public.swap_proposals (
  id uuid default uuid_generate_v4() primary key,
  initiator_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  target_item_id uuid references public.items(id),
  offered_item_id uuid references public.items(id),
  status text default 'PENDING' check (status in ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.swap_proposals enable row level security;

create policy "Users can see their swaps"
  on public.swap_proposals for select
  using ( auth.uid() = initiator_id or auth.uid() = receiver_id );

create policy "Users can create swaps"
  on public.swap_proposals for insert
  with check ( auth.uid() = initiator_id );
  
create policy "Users can update their swaps"
  on public.swap_proposals for update
  using ( auth.uid() = initiator_id or auth.uid() = receiver_id );
```

### Messages (Chat)
```sql
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id),
  receiver_id uuid references public.profiles(id),
  item_id uuid references public.items(id), -- Context
  content text,
  image_url text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.messages enable row level security;

create policy "Users can see their own messages"
  on public.messages for select
  using ( auth.uid() = sender_id or auth.uid() = receiver_id );

create policy "Users can send messages"
  on public.messages for insert
  with check ( auth.uid() = sender_id );
  
create policy "Users can mark messages as read"
  on public.messages for update
  using ( auth.uid() = receiver_id );
```

### Notifications
```sql
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  type text, -- ORDER, MESSAGE, SYSTEM
  title text,
  message text,
  link text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.notifications enable row level security;

create policy "Users can see their own notifications"
  on public.notifications for select
  using ( auth.uid() = user_id );
```

### Reviews
```sql
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  reviewer_id uuid references public.profiles(id),
  target_user_id uuid references public.profiles(id),
  order_id uuid references public.transactions(id),
  rating int,
  comment text,
  tags text[], -- Array of strings
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.reviews enable row level security;
create policy "Reviews are public" on public.reviews for select using (true);
create policy "Users can create reviews" on public.reviews for insert with check (auth.uid() = reviewer_id);
```

### Saved Items (Watchlist)
```sql
create table public.saved_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  item_id uuid references public.items(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.saved_items enable row level security;
create policy "Users manage their own saved items" on public.saved_items for all using (auth.uid() = user_id);
```

### Reports (Moderation)
```sql
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles(id),
  item_id text, -- Flexible ID (can be item UUID or string like 'USER:123')
  reason text,
  status text default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.reports enable row level security;
create policy "Admins see reports" on public.reports for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
create policy "Users create reports" on public.reports for insert with check (auth.uid() = reporter_id);
```

### Verification Codes (Email OTP)
```sql
create table public.verification_codes (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  code text not null,
  expires_at timestamp with time zone default (now() + interval '15 minutes'),
  created_at timestamp with time zone default now()
);
alter table public.verification_codes enable row level security;
-- No public access policies needed, handled via secure RPC or edge function mostly.
```

### Bank Accounts
```sql
create table public.bank_accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  bank_name text,
  last4 text,
  holder_name text,
  created_at timestamp with time zone default now()
);
alter table public.bank_accounts enable row level security;
create policy "Users manage own banks" on public.bank_accounts for all using (auth.uid() = user_id);
```

### Blocked Users
```sql
create table public.blocked_users (
  id uuid default uuid_generate_v4() primary key,
  blocker_id uuid references public.profiles(id),
  blocked_id uuid references public.profiles(id),
  created_at timestamp with time zone default now(),
  unique(blocker_id, blocked_id)
);
alter table public.blocked_users enable row level security;
create policy "Users manage blocks" on public.blocked_users for all using (auth.uid() = blocker_id);
```

### App Config (Admin Settings)
```sql
create table public.app_config (
  key text primary key,
  value text
);
-- Seed default config
insert into public.app_config (key, value) values 
('admin_signup_code', 'SECONDS2024'),
('global_banner_active', 'false'),
('global_banner_text', ''),
('active_modules', '{"BUY":true,"SELL":true,"RENT":true,"SHARE":true,"SWAP":true,"EARN":true,"REQUEST":true}');

alter table public.app_config enable row level security;
create policy "Public read config" on public.app_config for select using (true);
create policy "Admin update config" on public.app_config for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
```

## 4. Functions & Triggers

### Handle New User (Auto-create Profile)
```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Profile creation is handled by client-side API call for flexibility with extra fields,
  -- but we can ensure a basic row exists if needed. 
  -- For this app structure, we rely on the AuthView.tsx logic to insert the profile.
  return new;
end;
$$ language plpgsql security definer;
```

### Create Order RPC (Atomic Transaction)
```sql
create or replace function create_order(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_item_id uuid,
  p_amount numeric
)
returns void as $$
begin
  -- Insert Transaction
  insert into public.transactions (buyer_id, seller_id, item_id, amount, status)
  values (p_buyer_id, p_seller_id, p_item_id, p_amount, 'PENDING');

  -- Mark Item as Sold (or Reserved)
  update public.items set status = 'SOLD' where id = p_item_id;

  -- Create Notification for Seller
  insert into public.notifications (user_id, type, title, message, link)
  values (p_seller_id, 'ORDER', 'New Order Received', 'Someone bought your item! Check orders to proceed.', 'MY_ORDERS');
end;
$$ language plpgsql security definer;
```

### Complete Order RPC (Release Funds)
```sql
create or replace function complete_order(
  p_txn_id uuid,
  p_user_id uuid -- The buyer confirming receipt
)
returns void as $$
declare
  v_seller_id uuid;
  v_amount numeric;
begin
  -- Verify transaction exists and belongs to buyer
  select seller_id, amount into v_seller_id, v_amount
  from public.transactions
  where id = p_txn_id and buyer_id = p_user_id and status = 'PENDING';

  if v_seller_id is null then
    raise exception 'Transaction not found or unauthorized';
  end if;

  -- Update Transaction Status
  update public.transactions set status = 'COMPLETED' where id = p_txn_id;

  -- Add funds to Seller Wallet
  update public.profiles set earnings = earnings + v_amount where id = v_seller_id;

  -- Notify Seller
  insert into public.notifications (user_id, type, title, message, link)
  values (v_seller_id, 'ORDER', 'Funds Released', 'Order completed. $' || v_amount || ' added to wallet.', 'PROFILE');
end;
$$ language plpgsql security definer;
```

### Withdraw Funds RPC
```sql
create or replace function withdraw_funds(
  p_user_id uuid,
  p_amount numeric
)
returns void as $$
declare
  v_balance numeric;
begin
  select earnings into v_balance from public.profiles where id = p_user_id;
  
  if v_balance < p_amount then
    raise exception 'Insufficient funds';
  end if;

  -- Deduct
  update public.profiles set earnings = earnings - p_amount where id = p_user_id;
  
  -- (In real app, trigger Payout API here)
end;
$$ language plpgsql security definer;
```

## 5. Storage Buckets
Go to Storage in Supabase Dashboard and create two Public buckets:
1. `items`
2. `verifications`

Add policy to allow public read/upload for authenticated users:
*   Bucket: `items` -> Policy: `Public Access` (Select), `Auth Upload` (Insert).
*   Bucket: `verifications` -> Policy: `Auth Upload` (Insert), `Admin Read` (Select - requires RLS logic or just restricted folder paths).
