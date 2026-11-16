-- DRAGONOV fresh Supabase schema
-- Run once in Supabase SQL Editor on a NEW project/database.
create extension if not exists pgcrypto;

create table if not exists public.admin_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('owner','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('event','course','quiz')),
  category text,
  title text not null,
  description text,
  event_date timestamptz,
  location text,
  link_url text,
  published boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_link_https check (link_url is null or link_url ~* '^https://')
);

alter table public.admin_members enable row level security;
alter table public.content_items enable row level security;

-- SECURITY DEFINER helpers avoid recursive RLS checks on admin_members.
create or replace function public.dragonov_is_active_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_members
    where user_id = (select auth.uid()) and active = true
  );
$$;

create or replace function public.dragonov_is_owner()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_members
    where user_id = (select auth.uid()) and active = true and role = 'owner'
  );
$$;

revoke all on function public.dragonov_is_active_admin() from public;
revoke all on function public.dragonov_is_owner() from public;
grant execute on function public.dragonov_is_active_admin() to authenticated;
grant execute on function public.dragonov_is_owner() to authenticated;

-- Admins can read their own membership row.
create policy "admin_members_read_self" on public.admin_members
for select to authenticated using (user_id = (select auth.uid()));

-- Only owners can see the full administrator list.
create policy "admin_members_owner_read_all" on public.admin_members
for select to authenticated using ((select public.dragonov_is_owner()));

-- Owners can change membership status. No client-side inserts/deletes.
create policy "admin_members_owner_update" on public.admin_members
for update to authenticated
using ((select public.dragonov_is_owner()))
with check ((select public.dragonov_is_owner()));

-- Public visitors can only read published items.
create policy "content_public_read_published" on public.content_items
for select to anon, authenticated using (published=true);

-- Active admins can read all content, including drafts.
create policy "content_admin_read_all" on public.content_items
for select to authenticated using ((select public.dragonov_is_active_admin()));

create policy "content_admin_insert" on public.content_items
for insert to authenticated with check ((select public.dragonov_is_active_admin()));

create policy "content_admin_update" on public.content_items
for update to authenticated
using ((select public.dragonov_is_active_admin()))
with check ((select public.dragonov_is_active_admin()));

create policy "content_admin_delete" on public.content_items
for delete to authenticated using ((select public.dragonov_is_active_admin()));

grant select on public.content_items to anon, authenticated;
grant insert, update, delete on public.content_items to authenticated;
grant select, update on public.admin_members to authenticated;

-- Bootstrap PRIMARY OWNER:
-- 1) First create your own user in Supabase Authentication > Users.
-- 2) Copy that user's UUID and email.
-- 3) Replace values below and run this INSERT separately.
-- INSERT INTO public.admin_members(user_id,email,role,active)
-- VALUES ('YOUR_AUTH_USER_UUID','you@example.com','owner',true);
