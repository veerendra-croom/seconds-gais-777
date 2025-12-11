# Database Setup Guide

Follow these steps to initialize the backend for Seconds-App.

## 1. Prerequisites
1.  Create a project at [Supabase.com](https://supabase.com).
2.  Go to **Project Settings -> API** and copy your `Project URL` and `anon` public key.
3.  Add these to your frontend `.env` file (or `services/supabaseClient.ts`).

## 2. SQL Initialization
Copy and paste the following SQL blocks into the Supabase **SQL Editor**.

### Step 2.1: Enable Extensions
```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";
-- Enable Fuzzy Search for marketplace
create extension if not exists "pg_trgm";
```

### Step 2.2: Create Tables
*Note: Refer to `database_schemas.md` for the specific column definitions if you need to modify them.*

Run the **SQL Schema** provided in `database_schemas.md`. It is critical to run them in order to avoid Foreign Key errors (Profiles -> Items -> Transactions).

### Step 2.3: Deploy Stored Procedures (RPC)
These functions handle business logic securely on the server.

```sql
-- 1. Create Order
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
  
  -- Mark item as sold to prevent double-buy
  update public.items set status = 'SOLD' where id = p_item_id;
  
  -- Notify seller
  insert into public.notifications (user_id, type, title, message, link)
  values (p_seller_id, 'ORDER', 'New Order Received', 'Someone bought your item!', 'MY_ORDERS');
end;
$$ language plpgsql security definer;

-- 2. Complete Order (Release Funds)
create or replace function complete_order(
  p_txn_id uuid,
  p_user_id uuid -- Buyer ID confirming
)
returns void as $$
declare
  v_seller_id uuid;
  v_amount numeric;
begin
  select seller_id, amount into v_seller_id, v_amount
  from public.transactions
  where id = p_txn_id and buyer_id = p_user_id and status = 'PENDING';

  if v_seller_id is null then
    raise exception 'Transaction not found or unauthorized';
  end if;

  update public.transactions set status = 'COMPLETED' where id = p_txn_id;
  update public.profiles set earnings = earnings + v_amount where id = v_seller_id;
  
  insert into public.notifications (user_id, type, title, message, link)
  values (v_seller_id, 'ORDER', 'Funds Released', 'Order completed. $' || v_amount || ' added.', 'PROFILE');
end;
$$ language plpgsql security definer;

-- 3. Withdraw Funds
create or replace function withdraw_funds(
  p_user_id uuid,
  p_amount numeric
)
returns void as $$
declare
  v_balance numeric;
begin
  select earnings into v_balance from public.profiles where id = p_user_id;
  if v_balance < p_amount then raise exception 'Insufficient funds'; end if;
  update public.profiles set earnings = earnings - p_amount where id = p_user_id;
end;
$$ language plpgsql security definer;
```

## 3. Seed Initial Data
Populate the app with required configuration and college data.

```sql
insert into public.app_config (key, value) values 
('admin_signup_code', 'SECONDS2024'),
('global_banner_active', 'false'),
('maintenance_mode', 'false'),
('transaction_fee_percent', '5');

insert into public.colleges (name, domain, latitude, longitude) values 
('University of California, Los Angeles', 'ucla.edu', 34.0689, -118.4452),
('University of Southern California', 'usc.edu', 34.0224, -118.2851),
('New York University', 'nyu.edu', 40.7295, -73.9965);
```

## 4. Storage Configuration
1.  Go to **Storage** in the Dashboard.
2.  Create a new bucket named `items`.
    *   **Public**: Yes.
    *   **RLS Policy**: Allow `SELECT` for public. Allow `INSERT` for authenticated users.
3.  Create a new bucket named `verifications`.
    *   **Public**: No (Private).
    *   **RLS Policy**: Allow `INSERT` for authenticated users. Allow `SELECT` only for users with `role = 'ADMIN'`.

## 5. Edge Functions (Optional)
For Stripe and Email integration, deploy the functions located in `supabase/functions/`.
```bash
supabase functions deploy payment-sheet
supabase functions deploy send-email
supabase functions deploy push-notification
```
