create table if not exists public.settings (
  id text primary key default 'app',
  profit_percent numeric not null default 25,
  owner_whatsapp text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  title text not null,
  description text not null default '',
  category text not null default 'fashion',
  tag text not null default 'Fashion',
  base_price numeric not null default 0,
  stock integer not null default 0,
  rating numeric not null default 4.8,
  thumbnail text not null,
  images jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.settings (id, profit_percent, owner_whatsapp)
values ('app', 25, '')
on conflict (id) do nothing;

create index if not exists products_category_idx on public.products (category);
create index if not exists products_created_at_idx on public.products (created_at desc);


-- JASTIP orders and their lifecycle, shared between storefront and backoffice.
create table if not exists public.orders (
  id text primary key,
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  payment jsonb not null default '{}'::jsonb,
  status text not null default 'PROCESSING' check (status in ('PROCESSING', 'APPROVED', 'REJECTED', 'PURCHASED', 'DELIVERED')),
  approval_status text not null default 'PENDING' check (approval_status in ('PENDING', 'APPROVED', 'REJECTED')),
  purchased_at timestamptz,
  delivered_at timestamptz,
  rejection_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- Safe migration for existing deployments.
alter table public.products add column if not exists colors jsonb not null default '[]'::jsonb;

create table if not exists public.reviews (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique(order_id, product_id)
);
create index if not exists reviews_product_idx on public.reviews(product_id);

create table if not exists public.customer_accounts (
  id text primary key, name text not null, email text not null unique, phone text not null default '', address text not null default '',
  password_salt text not null, password_hash text not null, created_at timestamptz not null default now()
);


-- Review appreciation coupons are persisted per customer account, not browser storage.
create table if not exists public.review_coupons (
  code text primary key,
  customer_email text not null references public.customer_accounts(email) on update cascade on delete cascade,
  order_id text not null references public.orders(id) on delete cascade,
  discount_percent numeric not null default 2.5 check (discount_percent > 0 and discount_percent <= 2.5),
  used boolean not null default false,
  used_for text not null default '',
  created_at timestamptz not null default now(),
  used_at timestamptz
);
create index if not exists review_coupons_customer_idx on public.review_coupons(customer_email);
