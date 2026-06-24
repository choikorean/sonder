-- database.sql
-- TaxFlo Supabase schema
-- Apply this in Supabase SQL editor.

-- Enable extensions
create extension if not exists "pgcrypto";

-- =====================================================
-- ENUM-LIKE CHECK VALUES ARE KEPT AS TEXT FOR SIMPLICITY
-- =====================================================

-- =====================================================
-- PROFILES
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  office_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Profile auto creation trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================================
-- SUBSCRIPTIONS
-- =====================================================

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'FREE',
  status text not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- User should not directly insert/update subscriptions from client.
-- Server route with service role handles writes.

-- =====================================================
-- REQUEST GENERATIONS
-- =====================================================

create table if not exists public.request_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_type text not null check (tax_type in ('VAT', 'INCOME_TAX', 'CORPORATE_TAX', 'WITHHOLDING_TAX', 'YEAR_END_SETTLEMENT')),
  business_type text not null check (business_type in ('SOLE', 'CORPORATION', 'FREELANCER', 'ECOMMERCE', 'RESTAURANT', 'SERVICE', 'ETC')),
  memo text,
  result text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_request_generations_user_created
  on public.request_generations(user_id, created_at desc);

alter table public.request_generations enable row level security;

create policy "request_generations_select_own"
  on public.request_generations
  for select
  using (auth.uid() = user_id);

create policy "request_generations_insert_own"
  on public.request_generations
  for insert
  with check (auth.uid() = user_id);

create policy "request_generations_delete_own"
  on public.request_generations
  for delete
  using (auth.uid() = user_id);

-- =====================================================
-- CONSULTATION SUMMARIES
-- =====================================================

create table if not exists public.consultation_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  audio_url text,
  original_text text,
  transcript text,
  summary text not null,
  client_summary text not null,
  required_documents text,
  next_actions text,
  created_at timestamptz not null default now()
);

create index if not exists idx_consultation_summaries_user_created
  on public.consultation_summaries(user_id, created_at desc);

alter table public.consultation_summaries enable row level security;

create policy "consultation_summaries_select_own"
  on public.consultation_summaries
  for select
  using (auth.uid() = user_id);

create policy "consultation_summaries_insert_own"
  on public.consultation_summaries
  for insert
  with check (auth.uid() = user_id);

create policy "consultation_summaries_delete_own"
  on public.consultation_summaries
  for delete
  using (auth.uid() = user_id);

-- =====================================================
-- REPORT EXPLANATIONS
-- =====================================================

create table if not exists public.report_explanations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tax_type text not null check (tax_type in ('VAT', 'INCOME_TAX', 'CORPORATE_TAX', 'WITHHOLDING_TAX', 'YEAR_END_SETTLEMENT')),
  current_tax numeric not null check (current_tax >= 0),
  previous_tax numeric check (previous_tax >= 0),
  change_reason text,
  memo text,
  result text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_explanations_user_created
  on public.report_explanations(user_id, created_at desc);

alter table public.report_explanations enable row level security;

create policy "report_explanations_select_own"
  on public.report_explanations
  for select
  using (auth.uid() = user_id);

create policy "report_explanations_insert_own"
  on public.report_explanations
  for insert
  with check (auth.uid() = user_id);

create policy "report_explanations_delete_own"
  on public.report_explanations
  for delete
  using (auth.uid() = user_id);

-- =====================================================
-- USAGE EVENTS
-- =====================================================

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('request_generation', 'consultation_summary', 'report_explanation')),
  tokens_estimated integer,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_events_user_feature_created
  on public.usage_events(user_id, feature, created_at desc);

alter table public.usage_events enable row level security;

create policy "usage_events_select_own"
  on public.usage_events
  for select
  using (auth.uid() = user_id);

create policy "usage_events_insert_own"
  on public.usage_events
  for insert
  with check (auth.uid() = user_id);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- =====================================================
-- STORAGE BUCKET
-- =====================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'consultation-audio',
  'consultation-audio',
  false,
  26214400,
  array[
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wav',
    'audio/webm'
  ]
)
on conflict (id) do nothing;

-- Storage policies
-- Path convention: user_id/file_name

create policy "consultation_audio_select_own"
  on storage.objects
  for select
  using (
    bucket_id = 'consultation-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "consultation_audio_insert_own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'consultation-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "consultation_audio_delete_own"
  on storage.objects
  for delete
  using (
    bucket_id = 'consultation-audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- HELPER VIEW: CURRENT MONTH USAGE
-- =====================================================

create or replace view public.current_month_usage as
select
  user_id,
  feature,
  count(*)::integer as usage_count
from public.usage_events
where created_at >= date_trunc('month', now())
group by user_id, feature;

-- Views use underlying table RLS in Supabase/Postgres where applicable.

