-- NicePay card billing: subscriptions extension + billing tables

alter table public.subscriptions
  add column if not exists started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists next_billing_at timestamptz,
  add column if not exists canceled_at timestamptz;

alter table public.payment_orders
  add column if not exists moid text,
  add column if not exists checkout_type text not null default 'subscription',
  add column if not exists goods_name text,
  add column if not exists auth_tid text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists payment_orders_moid_key
  on public.payment_orders (moid)
  where moid is not null;

create table if not exists public.billing_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nicepay_bid text not null,
  nicepay_mid text not null,
  card_name text,
  card_no_masked text,
  card_code text,
  card_cl text,
  is_active boolean not null default true,
  issued_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_keys_user_active
  on public.billing_keys (user_id, is_active)
  where is_active = true;

alter table public.billing_keys enable row level security;

create policy "billing_keys_select_own"
  on public.billing_keys
  for select
  using (auth.uid() = user_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  payment_order_id uuid references public.payment_orders(id) on delete set null,
  nicepay_tid text,
  moid text not null,
  amount integer not null check (amount >= 0),
  goods_name text not null,
  result_code text,
  result_msg text,
  auth_code text,
  auth_date text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'canceled')),
  paid_at timestamptz,
  failed_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_user_created
  on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

create policy "payments_select_own"
  on public.payments
  for select
  using (auth.uid() = user_id);

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_no integer not null default 1 check (attempt_no >= 1),
  result_code text,
  result_msg text,
  attempted_at timestamptz not null default now(),
  raw_response jsonb
);

create index if not exists idx_payment_attempts_payment
  on public.payment_attempts (payment_id, attempt_no);

alter table public.payment_attempts enable row level security;

create policy "payment_attempts_select_own"
  on public.payment_attempts
  for select
  using (auth.uid() = user_id);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_events_user_created
  on public.billing_events (user_id, created_at desc);

alter table public.billing_events enable row level security;

create policy "billing_events_select_own"
  on public.billing_events
  for select
  using (auth.uid() = user_id);
