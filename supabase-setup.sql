-- ============================================================
--  STREAM — Personal Media Site
--  Supabase Database Setup
--  Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled)
create extension if not exists "pgcrypto";


-- ============================================================
-- TABLES
-- ============================================================

-- Posts
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  media_url   text,
  media_type  text not null default 'text', -- 'video' | 'image' | 'text'
  created_at  timestamptz not null default now(),
  views       integer not null default 0,
  likes       integer not null default 0
);

-- Comments (anonymous, no auth required)
create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

-- Likes (one per device identifier)
create table if not exists likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  identifier text not null,
  created_at timestamptz not null default now(),
  unique (post_id, identifier)
);

-- Views (deduplicated per device)
create table if not exists views (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  identifier text not null,
  created_at timestamptz not null default now(),
  unique (post_id, identifier)
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_posts_created_at   on posts(created_at desc);
create index if not exists idx_comments_post_id   on comments(post_id);
create index if not exists idx_likes_post_id       on likes(post_id);
create index if not exists idx_views_post_id       on views(post_id);


-- ============================================================
-- RPC FUNCTIONS (atomic counters)
-- ============================================================

-- Increment views counter
create or replace function increment_views(post_id uuid)
returns void
language sql
security definer
as $$
  update posts set views = views + 1 where id = post_id;
$$;

-- Increment likes counter
create or replace function increment_likes(post_id uuid)
returns void
language sql
security definer
as $$
  update posts set likes = likes + 1 where id = post_id;
$$;

-- Decrement likes counter (floor at 0)
create or replace function decrement_likes(post_id uuid)
returns void
language sql
security definer
as $$
  update posts set likes = greatest(0, likes - 1) where id = post_id;
$$;


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table posts    enable row level security;
alter table comments enable row level security;
alter table likes    enable row level security;
alter table views    enable row level security;

-- Posts: public can read, service role can do everything
create policy "Public can read posts"
  on posts for select
  using (true);

create policy "Service role manages posts"
  on posts for all
  using (auth.role() = 'service_role');

-- Comments: public can read and insert, service role manages
create policy "Public can read comments"
  on comments for select
  using (true);

create policy "Public can add comments"
  on comments for insert
  with check (true);

create policy "Service role manages comments"
  on comments for all
  using (auth.role() = 'service_role');

-- Likes: public can read and insert, service role manages
create policy "Public can read likes"
  on likes for select
  using (true);

create policy "Public can add likes"
  on likes for insert
  with check (true);

create policy "Service role manages likes"
  on likes for all
  using (auth.role() = 'service_role');

-- Views: service role only (we only write from server)
create policy "Service role manages views"
  on views for all
  using (auth.role() = 'service_role');


-- ============================================================
-- STORAGE BUCKET
-- Run this separately if bucket doesn't already exist
-- ============================================================

-- Create bucket (set public = true so media URLs work without auth)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  524288000,  -- 500MB
  array[
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'
  ]
)
on conflict (id) do nothing;

-- Storage policy: anyone can read (public bucket)
create policy "Public read storage"
  on storage.objects for select
  using (bucket_id = 'media');

-- Storage policy: service role can upload and delete
create policy "Service role upload"
  on storage.objects for insert
  with check (bucket_id = 'media' AND auth.role() = 'service_role');

create policy "Service role delete"
  on storage.objects for delete
  using (bucket_id = 'media' AND auth.role() = 'service_role');

-- Allow signed upload URLs (used from admin page)
create policy "Authenticated upload via signed URL"
  on storage.objects for insert
  with check (bucket_id = 'media');


-- ============================================================
-- Done! Your database is ready.
-- ============================================================
