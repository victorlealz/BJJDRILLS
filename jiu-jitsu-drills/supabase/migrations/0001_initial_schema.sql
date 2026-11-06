create extension if not exists pgcrypto;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  library_initialized boolean not null default false,
  default_seconds_per_technique integer not null default 300 check (default_seconds_per_technique between 30 and 3600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.technique_groups (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.techniques (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null references public.technique_groups(id),
  name text not null check (char_length(trim(name)) > 0),
  notes text,
  level text not null check (level in ('fundamental','advanced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.drill_logs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  technique_id uuid not null references public.techniques(id),
  performed_on date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index profiles_user_id_idx on public.profiles(user_id);
create index technique_groups_user_id_idx on public.technique_groups(user_id);
create index technique_groups_user_sort_idx on public.technique_groups(user_id, sort_order);
create index technique_groups_updated_idx on public.technique_groups(user_id, updated_at);
create index techniques_user_id_idx on public.techniques(user_id);
create index techniques_user_group_idx on public.techniques(user_id, group_id);
create index techniques_user_level_idx on public.techniques(user_id, level);
create index techniques_updated_idx on public.techniques(user_id, updated_at);
create index drill_logs_user_id_idx on public.drill_logs(user_id);
create index drill_logs_user_date_idx on public.drill_logs(user_id, performed_on desc);
create index drill_logs_user_technique_idx on public.drill_logs(user_id, technique_id);
create index drill_logs_updated_idx on public.drill_logs(user_id, updated_at);

alter table public.profiles enable row level security;
alter table public.technique_groups enable row level security;
alter table public.techniques enable row level security;
alter table public.drill_logs enable row level security;

revoke all on table public.profiles, public.technique_groups, public.techniques, public.drill_logs from anon, authenticated;
grant select, insert, update, delete on table public.profiles, public.technique_groups, public.techniques, public.drill_logs to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = user_id);

create policy "groups_select_own" on public.technique_groups for select to authenticated using ((select auth.uid()) = user_id);
create policy "groups_insert_own" on public.technique_groups for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "groups_update_own" on public.technique_groups for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "groups_delete_own" on public.technique_groups for delete to authenticated using ((select auth.uid()) = user_id);

create policy "techniques_select_own" on public.techniques for select to authenticated using ((select auth.uid()) = user_id);
create policy "techniques_insert_own" on public.techniques for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "techniques_update_own" on public.techniques for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "techniques_delete_own" on public.techniques for delete to authenticated using ((select auth.uid()) = user_id);

create policy "logs_select_own" on public.drill_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "logs_insert_own" on public.drill_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "logs_update_own" on public.drill_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "logs_delete_own" on public.drill_logs for delete to authenticated using ((select auth.uid()) = user_id);
