# Database Schema Reference

## 1. public.profiles
*Extends Supabase Auth with application-specific user data.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | PK | FK to `auth.users.id` |
| `email` | text | - | User email |
| `full_name` | text | - | Display name |
| `avatar_url` | text | - | Public URL |
| `college` | text | - | University name |
| `role` | text | 'STUDENT' | 'STUDENT' or 'ADMIN' |
| `verified` | bool | false | ID verification status |
| `verification_status` | text | 'NONE' | NONE, PENDING, VERIFIED, REJECTED |
| `earnings` | numeric | 0.00 | Wallet balance (USD) |
| `savings` | numeric | 0 | Gamification points (Eco Impact) |
| `bio` | text | - | Profile biography |
| `social_links` | jsonb | {} | e.g. `{ "instagram": "handle" }` |
| `trusted_contacts` | text[] | [] | Array of emails for SOS |
| `college_email` | text | - | .edu email address |
| `college_email_verified`| bool | false | .edu verification status |
| `banned` | bool | false | Access control |

## 2. public.items
*The central inventory for the marketplace.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `seller_id` | uuid | - | FK to `profiles.id` |
| `title` | text | - | Item title |
| `description` | text | - | Detailed description |
| `price` | numeric | 0 | Price in USD |
| `category` | text | - | Electronics, Books, etc. |
| `type` | text | 'SALE' | SALE, RENT, SERVICE, SWAP, REQUEST |
| `image` | text | - | JSON Array of image URLs |
| `status` | text | 'ACTIVE' | ACTIVE, SOLD, DRAFT, ARCHIVED |
| `college` | text | - | Campus visibility scope |
| `rating` | numeric | 5.0 | Average item rating |
| `latitude` | numeric | - | Geo location (jittered) |
| `longitude` | numeric | - | Geo location (jittered) |

## 3. public.transactions
*Financial records for 'SALE' and 'RENT' types.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `item_id` | uuid | - | FK to `items.id` |
| `buyer_id` | uuid | - | FK to `profiles.id` |
| `seller_id` | uuid | - | FK to `profiles.id` |
| `amount` | numeric | - | Transaction value |
| `status` | text | 'PENDING' | PENDING, COMPLETED, CANCELLED |
| `meetup_code` | text | - | 6-digit verification code |

## 4. public.bookings
*Time-based reservations for 'SERVICE' type.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `service_id` | uuid | - | FK to `items.id` |
| `booker_id` | uuid | - | FK to `profiles.id` |
| `provider_id` | uuid | - | FK to `profiles.id` |
| `booking_date` | timestamp | - | Scheduled time |
| `status` | text | 'REQUESTED' | REQUESTED, ACCEPTED, REJECTED |

## 5. public.swap_proposals
*Barter system logic.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `initiator_id` | uuid | - | FK to `profiles.id` |
| `receiver_id` | uuid | - | FK to `profiles.id` |
| `target_item_id` | uuid | - | FK to `items.id` (Wanted) |
| `offered_item_id` | uuid | - | FK to `items.id` (Offered) |
| `status` | text | 'PENDING' | PENDING, ACCEPTED, REJECTED |

## 6. public.messages
*Real-time chat system.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `sender_id` | uuid | - | FK to `profiles.id` |
| `receiver_id` | uuid | - | FK to `profiles.id` |
| `item_id` | uuid | - | Contextual Item ID |
| `content` | text | - | Message body |
| `image_url` | text | - | Optional attachment |
| `is_read` | bool | false | Read receipt |

## 7. public.notifications
*System alerts.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `user_id` | uuid | - | Recipient |
| `type` | text | - | ORDER, MESSAGE, SYSTEM, ALERT |
| `title` | text | - | Header |
| `message` | text | - | Body |
| `link` | text | - | Deep link (e.g. 'MY_ORDERS') |
| `is_read` | bool | false | Read status |

## 8. public.devices
*Stores Web Push API subscriptions.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `user_id` | uuid | - | FK to `profiles.id` |
| `subscription` | jsonb | - | PushSubscription JSON object |
| `updated_at` | timestamp | now() | Last active |

## 9. public.verification_codes
*OTP codes for .edu email verification.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `email` | text | - | Target email |
| `code` | text | - | 6-digit OTP |
| `expires_at` | timestamp | +15m | Expiration time |

## 10. public.bank_accounts
*Saved withdrawal methods.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `user_id` | uuid | - | FK to `profiles.id` |
| `bank_name` | text | - | e.g. "Chase" |
| `last4` | text | - | e.g. "1234" |
| `holder_name` | text | - | Account holder name |

## 11. public.blocked_users
*User blocking logic.*

| Column | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | uuid | uuid_v4 | Primary Key |
| `blocker_id` | uuid | - | Who initiated block |
| `blocked_id` | uuid | - | Who is blocked |

## 12. public.app_config
*Remote configuration key-value store.*

| Key | Value | Description |
| :--- | :--- | :--- |
| `admin_signup_code` | text | Secret code for admin registration |
| `global_banner_text` | text | Announcement bar text |
| `maintenance_mode` | boolean | 'true'/'false' |
| `active_modules` | jsonb | Feature flags for UI modules |
