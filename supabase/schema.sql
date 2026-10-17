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
