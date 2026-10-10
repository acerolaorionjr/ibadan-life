-- Ibadan Life multiplayer foundation.
-- Apply ONLY to a dedicated Supabase project for Ibadan Life, NOT Acerola AI.
-- Supabase Auth must be enabled. Keep private Realtime channels enabled.
create extension if not exists pgcrypto;

create table if not exists public.ibadan_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default 'Player' check (char_length(display_name) between 1 and 24),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ibadan_profiles enable row level security;

create table if not exists public.ibadan_game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (pg_column_size(save_data) < 1000000)
);
alter table public.ibadan_game_saves enable row level security;

create table if not exists public.ibadan_chat_rooms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  room_type text not null default 'public' check (room_type in ('public','venue')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.ibadan_chat_rooms enable row level security;

create table if not exists public.ibadan_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.ibadan_blocks enable row level security;

create table if not exists public.ibadan_room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.ibadan_chat_rooms(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists ibadan_room_messages_room_time_idx
  on public.ibadan_room_messages(room_id, created_at desc);
alter table public.ibadan_room_messages enable row level security;

create table if not exists public.ibadan_dm_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.ibadan_dm_conversations enable row level security;

create table if not exists public.ibadan_dm_members (
  conversation_id uuid not null references public.ibadan_dm_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (conversation_id, user_id)
);
create index if not exists ibadan_dm_members_user_idx on public.ibadan_dm_members(user_id);
alter table public.ibadan_dm_members enable row level security;

create table if not exists public.ibadan_dm_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ibadan_dm_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists ibadan_dm_messages_conversation_time_idx
  on public.ibadan_dm_messages(conversation_id, created_at desc);
alter table public.ibadan_dm_messages enable row level security;

create table if not exists public.ibadan_player_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam','harassment','inappropriate','impersonation','other')),
  details text not null default '' check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  status text not null default 'open' check (status in ('open','reviewing','closed')),
  check (reporter_id <> reported_id)
);
alter table public.ibadan_player_reports enable row level security;

-- A profile is created by the database after Auth sign-up; clients cannot choose another user's id.
create or replace function public.ibadan_create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $ibadan$
declare
  wanted_username text;
  wanted_display text;
begin
  wanted_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', 'player_' || left(new.id::text, 8)),
    '[^a-z0-9_]', '', 'g'
  ));
  if char_length(wanted_username) < 3 then
    wanted_username := 'player_' || left(new.id::text, 8);
  end if;
  wanted_username := left(wanted_username, 20);
  wanted_display := left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Player'), 24);
  begin
    insert into public.ibadan_profiles(id, username, display_name)
    values (new.id, wanted_username, wanted_display)
    on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.ibadan_profiles(id, username, display_name)
    values (new.id, 'player_' || left(replace(new.id::text, '-', ''), 12), wanted_display)
    on conflict (id) do nothing;
  end;
  return new;
end;
$ibadan$;

drop trigger if exists ibadan_auth_user_created on auth.users;
create trigger ibadan_auth_user_created
after insert on auth.users
for each row execute function public.ibadan_create_profile();

-- Policies: public directory is visible only to signed-in players.
drop policy if exists "ibadan_profiles_read_signed_in" on public.ibadan_profiles;
create policy "ibadan_profiles_read_signed_in" on public.ibadan_profiles
for select to authenticated using (true);
drop policy if exists "ibadan_profiles_update_self" on public.ibadan_profiles;
create policy "ibadan_profiles_update_self" on public.ibadan_profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));
grant select, update on public.ibadan_profiles to authenticated;

drop policy if exists "ibadan_saves_read_self" on public.ibadan_game_saves;
create policy "ibadan_saves_read_self" on public.ibadan_game_saves
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "ibadan_saves_insert_self" on public.ibadan_game_saves;
create policy "ibadan_saves_insert_self" on public.ibadan_game_saves
for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "ibadan_saves_update_self" on public.ibadan_game_saves;
create policy "ibadan_saves_update_self" on public.ibadan_game_saves
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
grant select, insert, update on public.ibadan_game_saves to authenticated;

drop policy if exists "ibadan_rooms_read_signed_in" on public.ibadan_chat_rooms;
create policy "ibadan_rooms_read_signed_in" on public.ibadan_chat_rooms
for select to authenticated using (active = true);
grant select on public.ibadan_chat_rooms to authenticated;

drop policy if exists "ibadan_blocks_read_self" on public.ibadan_blocks;
create policy "ibadan_blocks_read_self" on public.ibadan_blocks
for select to authenticated using (blocker_id = (select auth.uid()));
drop policy if exists "ibadan_blocks_insert_self" on public.ibadan_blocks;
create policy "ibadan_blocks_insert_self" on public.ibadan_blocks
for insert to authenticated with check (blocker_id = (select auth.uid()));
drop policy if exists "ibadan_blocks_delete_self" on public.ibadan_blocks;
create policy "ibadan_blocks_delete_self" on public.ibadan_blocks
for delete to authenticated using (blocker_id = (select auth.uid()));
grant select, insert, delete on public.ibadan_blocks to authenticated;

drop policy if exists "ibadan_room_messages_read" on public.ibadan_room_messages;
create policy "ibadan_room_messages_read" on public.ibadan_room_messages
for select to authenticated using (
  exists (select 1 from public.ibadan_chat_rooms r where r.id = room_id and r.active)
  and not exists (
    select 1 from public.ibadan_blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = sender_id)
       or (b.blocker_id = sender_id and b.blocked_id = (select auth.uid()))
  )
);
drop policy if exists "ibadan_room_messages_insert" on public.ibadan_room_messages;
create policy "ibadan_room_messages_insert" on public.ibadan_room_messages
for insert to authenticated with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.ibadan_chat_rooms r where r.id = room_id and r.active)
  and not exists (
    select 1 from public.ibadan_blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = sender_id)
       or (b.blocker_id = sender_id and b.blocked_id = (select auth.uid()))
  )
);
grant select, insert on public.ibadan_room_messages to authenticated;

create or replace function public.ibadan_is_dm_member(target_conversation uuid, target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $ibadan$
  select exists (select 1 from public.ibadan_dm_members m
    where m.conversation_id = target_conversation and m.user_id = target_user);
$ibadan$;
revoke all on function public.ibadan_is_dm_member(uuid, uuid) from public;
grant execute on function public.ibadan_is_dm_member(uuid, uuid) to authenticated;

drop policy if exists "ibadan_dm_members_read" on public.ibadan_dm_members;
create policy "ibadan_dm_members_read" on public.ibadan_dm_members
for select to authenticated using (
  public.ibadan_is_dm_member(ibadan_dm_members.conversation_id, (select auth.uid()))
);
grant select on public.ibadan_dm_members to authenticated;

drop policy if exists "ibadan_dm_conversations_read" on public.ibadan_dm_conversations;
create policy "ibadan_dm_conversations_read" on public.ibadan_dm_conversations
for select to authenticated using (
  public.ibadan_is_dm_member(ibadan_dm_conversations.id, (select auth.uid()))
);
grant select on public.ibadan_dm_conversations to authenticated;

drop policy if exists "ibadan_dm_messages_read" on public.ibadan_dm_messages;
create policy "ibadan_dm_messages_read" on public.ibadan_dm_messages
for select to authenticated using (
  public.ibadan_is_dm_member(ibadan_dm_messages.conversation_id, (select auth.uid()))
  and not exists (
    select 1 from public.ibadan_blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = sender_id)
       or (b.blocker_id = sender_id and b.blocked_id = (select auth.uid()))
  )
);
drop policy if exists "ibadan_dm_messages_insert" on public.ibadan_dm_messages;
create policy "ibadan_dm_messages_insert" on public.ibadan_dm_messages
for insert to authenticated with check (
  sender_id = (select auth.uid())
  and exists (select 1 from public.ibadan_dm_members m
    where m.conversation_id = ibadan_dm_messages.conversation_id and m.user_id = (select auth.uid()))
  and not exists (
    select 1 from public.ibadan_dm_members m
    join public.ibadan_blocks b on b.blocker_id = m.user_id and b.blocked_id = (select auth.uid())
    where m.conversation_id = ibadan_dm_messages.conversation_id and m.user_id <> (select auth.uid())
  )
  and not exists (
    select 1 from public.ibadan_dm_members m
    join public.ibadan_blocks b on b.blocker_id = (select auth.uid()) and b.blocked_id = m.user_id
    where m.conversation_id = ibadan_dm_messages.conversation_id and m.user_id <> (select auth.uid())
  )
);
grant select, insert on public.ibadan_dm_messages to authenticated;

-- Safely create/find a one-to-one DM. Clients cannot add arbitrary conversation members.
create or replace function public.ibadan_start_dm(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $ibadan$
declare
  me uuid := auth.uid();
  conversation uuid;
begin
  if me is null then raise exception 'Sign in required'; end if;
  if other_user is null or other_user = me then raise exception 'Choose another player'; end if;
  if not exists (select 1 from public.ibadan_profiles p where p.id = other_user) then
    raise exception 'Player not found';
  end if;
  if exists (select 1 from public.ibadan_blocks b where
    (b.blocker_id = me and b.blocked_id = other_user) or
    (b.blocker_id = other_user and b.blocked_id = me)) then
    raise exception 'Messaging is unavailable for this player';
  end if;
  select mine.conversation_id into conversation
  from public.ibadan_dm_members mine
  join public.ibadan_dm_members theirs on theirs.conversation_id = mine.conversation_id
  join public.ibadan_dm_conversations c on c.id = mine.conversation_id
  where mine.user_id = me and theirs.user_id = other_user
    and (select count(*) from public.ibadan_dm_members m where m.conversation_id = c.id) = 2
  limit 1;
  if conversation is null then
    insert into public.ibadan_dm_conversations default values returning id into conversation;
    insert into public.ibadan_dm_members(conversation_id, user_id)
    values (conversation, me), (conversation, other_user);
  end if;
  return conversation;
end;
$ibadan$;
revoke all on function public.ibadan_start_dm(uuid) from public;
grant execute on function public.ibadan_start_dm(uuid) to authenticated;

drop policy if exists "ibadan_reports_insert_self" on public.ibadan_player_reports;
create policy "ibadan_reports_insert_self" on public.ibadan_player_reports
for insert to authenticated with check (reporter_id = (select auth.uid()));
drop policy if exists "ibadan_reports_read_self" on public.ibadan_player_reports;
create policy "ibadan_reports_read_self" on public.ibadan_player_reports
for select to authenticated using (reporter_id = (select auth.uid()));
grant insert, select on public.ibadan_player_reports to authenticated;

-- Room list is safe to seed repeatedly.
insert into public.ibadan_chat_rooms(slug, name, room_type) values
  ('town-square','Town Square','public'),
  ('bodija-market','Bodija Market','venue'),
  ('dugbe','Dugbe','venue'),
  ('ui-campus','UI Campus','venue'),
  ('challenge','Challenge','venue'),
  ('business-network','Business Network','public')
on conflict (slug) do update set name = excluded.name, room_type = excluded.room_type;

-- Postgres Changes delivers committed room/DM messages only to users whose RLS permits SELECT.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ibadan_room_messages'
  ) then
    alter publication supabase_realtime add table public.ibadan_room_messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ibadan_dm_messages'
  ) then
    alter publication supabase_realtime add table public.ibadan_dm_messages;
  end if;
end $$;

-- Private Presence channels only. Keep "Allow public access" disabled in Supabase Realtime settings.
drop policy if exists "ibadan_presence_receive" on realtime.messages;
create policy "ibadan_presence_receive" on realtime.messages
for select to authenticated using (
  extension = 'presence' and topic like 'ibadan:presence:%'
);
drop policy if exists "ibadan_presence_publish" on realtime.messages;
create policy "ibadan_presence_publish" on realtime.messages
for insert to authenticated with check (
  extension = 'presence' and topic like 'ibadan:presence:%'
);
