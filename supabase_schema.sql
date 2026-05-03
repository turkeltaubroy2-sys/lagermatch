-- LagerMatch Supabase Schema
-- Run this entire script in Supabase SQL Editor

-- ============================================================
-- PROFILES
-- ============================================================
drop table if exists push_subscriptions cascade;
drop table if exists swipes cascade;
drop table if exists messages cascade;
drop table if exists drinks cascade;
drop table if exists matches cascade;
drop table if exists profiles cascade;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  first_name text not null,
  age integer not null,
  location text not null,
  gender text not null,
  interested_in text not null,
  funny_fact text,
  favorite_drink text,
  photo_url text,
  photo_urls text[] default '{}',
  last_seen timestamptz,
  is_blocked boolean default false,
  created_at timestamptz default now()
);

create index if not exists profiles_device_id_idx on profiles(device_id);
create index if not exists profiles_is_blocked_idx on profiles(is_blocked);

-- ============================================================
-- MATCHES
-- ============================================================
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references profiles(id) on delete cascade,
  user2_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user1_id, user2_id)
);

create index if not exists matches_user1_idx on matches(user1_id);
create index if not exists matches_user2_idx on matches(user2_id);

-- ============================================================
-- DRINKS
-- ============================================================
create table if not exists drinks (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now()
);

create index if not exists drinks_receiver_idx on drinks(receiver_id, status);
create index if not exists drinks_sender_idx on drinks(sender_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  receiver_id uuid references profiles(id) on delete cascade,
  content text,
  type text default 'text', -- 'text' or 'voice'
  audio_url text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists messages_conversation_idx on messages(sender_id, receiver_id);
create index if not exists messages_receiver_unread_idx on messages(receiver_id, is_read);

-- ============================================================
-- SWIPES (for admin stats tracking)
-- ============================================================
create table if not exists swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid references profiles(id) on delete cascade,
  swiped_id uuid references profiles(id) on delete cascade,
  direction text check (direction in ('left', 'right')),
  created_at timestamptz default now()
);

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz default now()
);

create index if not exists push_subscriptions_profile_id_idx on push_subscriptions(profile_id);

-- ============================================================
-- ROW LEVEL SECURITY - Allow all (no auth needed, device-id based)
-- ============================================================
alter table profiles enable row level security;
alter table matches enable row level security;
alter table drinks enable row level security;
alter table messages enable row level security;
alter table swipes enable row level security;
alter table push_subscriptions enable row level security;

-- Open policies (device-id based app, no user auth)
create policy "allow all profiles" on profiles for all using (true) with check (true);
create policy "allow all matches" on matches for all using (true) with check (true);
create policy "allow all drinks" on drinks for all using (true) with check (true);
create policy "allow all messages" on messages for all using (true) with check (true);
create policy "allow all swipes" on swipes for all using (true) with check (true);
create policy "allow all push_subscriptions" on push_subscriptions for all using (true) with check (true);

-- ============================================================
-- REALTIME - Enable for live features
-- ============================================================
alter publication supabase_realtime add table drinks;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table matches;

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
-- 1. Photos
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict do nothing;

drop policy if exists "allow public photo uploads" on storage.objects;
create policy "allow public photo uploads" on storage.objects for insert with check (bucket_id = 'photos');
drop policy if exists "allow public photo reads" on storage.objects;
create policy "allow public photo reads" on storage.objects for select using (bucket_id = 'photos');
drop policy if exists "allow public photo deletes" on storage.objects;
create policy "allow public photo deletes" on storage.objects for delete using (bucket_id = 'photos');

-- 2. Audio (for voice messages)
insert into storage.buckets (id, name, public) values ('audio', 'audio', true)
on conflict do nothing;

drop policy if exists "allow public audio uploads" on storage.objects;
create policy "allow public audio uploads" on storage.objects for insert with check (bucket_id = 'audio');
drop policy if exists "allow public audio reads" on storage.objects;
create policy "allow public audio reads" on storage.objects for select using (bucket_id = 'audio');
