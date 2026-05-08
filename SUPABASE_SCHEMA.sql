-- Supabase schema for POS app

-- Enable the pgcrypto extension if available for UUID generation
-- (Run as a privileged user in Supabase SQL editor if needed)
-- create extension if not exists pgcrypto;

-- PRODUCTS
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category text not null,
  price numeric not null,
  cost_price numeric not null default 0,
  image_url text,
  stock integer not null default 0,
  status text not null,
  location text not null,
  created_at timestamptz not null default now()
);

create index if not exists products_location_idx on products(location);
create index if not exists products_code_idx on products(code);

-- SALES
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_code text not null,
  quantity integer not null,
  price_at_sale numeric not null,
  discount numeric not null default 0,
  sold_at timestamptz not null default now(),
  location text not null,
  sold_by text not null
);

create index if not exists sales_sold_at_idx on sales(sold_at);
create index if not exists sales_product_idx on sales(product_id);

-- SHIPMENTS
create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_code text not null,
  quantity integer not null,
  from_location text not null,
  to_location text not null,
  status text not null,
  created_at timestamptz not null default now(),
  received_at timestamptz
);

create index if not exists shipments_to_location_idx on shipments(to_location);

-- Note: This schema assumes an application-level users table is not required
-- because the app will keep local users; if you later want to migrate users,
-- create a `users` table and consider using Supabase Auth + RLS for security.

-- LOCAL USERS (application-managed users, not Supabase Auth)
create table if not exists local_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  role text not null,
  name text not null,
  location text not null
);

-- REVENUE TRACKING
create table if not exists daily_revenue (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  today_revenue numeric not null default 0,
  total_revenue numeric not null default 0,
  items_sold integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists daily_revenue_date_idx on daily_revenue(date);

create index if not exists local_users_username_idx on local_users(username);

-- Seed default local_users for offline/dev environments.
-- The server also seeds users on startup when it has a service role key.
-- These INSERTs are idempotent: they only insert if the username does not exist.
insert into local_users (username, password_hash, role, name, location)
-- Note: default users are created by the backend server on startup.
-- Remove any local pre-seeded salesperson accounts here to keep only server-controlled users.

-- Row Level Security (RLS) and policies
-- Enable RLS on sensitive tables. The anon (client) role will only be allowed to SELECT products.
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shipments ENABLE ROW LEVEL SECURITY;

-- SHIPMENTS: allow public select for demo read-only access
CREATE POLICY IF NOT EXISTS "public_select_shipments"
  ON shipments
  FOR SELECT
  USING (true);

ALTER TABLE IF EXISTS local_users ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) to read products only
CREATE POLICY IF NOT EXISTS "public_select_products"
  ON products
  FOR SELECT
  USING (true);

-- Do NOT create INSERT/UPDATE/DELETE policies for products/sales/shipments for anon role.
-- The service role (server-side) will bypass RLS to perform writes.

-- Optional: restrict local_users visibility by removing public access
CREATE POLICY IF NOT EXISTS "no_public_select_local_users"
  ON local_users
  FOR SELECT
  USING (false);

-- Make sure only authenticated admins (via backend service role) can touch these tables.

