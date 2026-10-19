create table products (
  id text primary key, name text not null, tagline text, description text,
  category text not null check (category in ('Platform','Service','Add-on')),
  price numeric(10,2) not null, billing text not null check (billing in ('one-time','monthly','yearly')),
  features text[] not null default '{}'
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users on delete set null,
  first_name text, last_name text, email text unique not null, phone text,
  company text, role text, country text, timezone text, created_at timestamptz default now()
);

create table orders (
  id text primary key, customer_id uuid not null references customers on delete cascade,
  product_id text not null references products, amount numeric(10,2) not null, method text,
  status text not null default 'paid' check (status in ('paid','refund_pending','refunded','refund_denied')),
  created_at timestamptz not null default now()
);

create table refund_requests (
  id uuid primary key default gen_random_uuid(), order_id text not null references orders,
  customer_id uuid not null references customers, reason text not null,
  source text not null check (source in ('Purchase history','Chat')),
  status text not null default 'pending' check (status in ('pending','approved','denied')),
  created_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references customers,
  session_id text not null, sender text not null check (sender in ('customer','agent')),
  body text not null, created_at timestamptz default now()
);

-- Row-level security: customers see only their own rows; the hub uses the service role key.
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table refund_requests enable row level security;
alter table chat_messages enable row level security;

create function my_customer_id() returns uuid language sql stable security definer set search_path = public
as $$ select id from customers where auth_user_id = auth.uid() $$;

create policy "products readable" on products for select using (true);
create policy "own profile" on customers for all using (auth_user_id = auth.uid());
create policy "own orders" on orders for select using (customer_id = my_customer_id());
create policy "own refunds" on refund_requests for all using (customer_id = my_customer_id());
create policy "own chat" on chat_messages for all using (customer_id = my_customer_id());
