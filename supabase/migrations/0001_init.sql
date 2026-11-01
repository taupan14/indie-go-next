-- Indie GO: skema inti + RLS (Milestone 1)
create type user_role as enum ('user', 'super_admin');
create type account_status as enum ('active', 'suspended', 'banned');
create type content_status as enum ('published', 'hidden', 'locked');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  avatar_url text,
  bio text check (char_length(bio) <= 160),
  role user_role not null default 'user',
  status account_status not null default 'active',
  popularity int not null default 0,
  created_at timestamptz not null default now()
);

create table communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  logo_url text,
  banner_url text,
  announcement text,
  rules text,
  admin_id uuid not null references profiles(id),   -- 1 komunitas = 1 admin
  member_count int not null default 0,
  created_at timestamptz not null default now()
);

create table community_members (
  community_id uuid references communities(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index on community_members (user_id);

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  color text not null default '#A80000',
  sort int not null default 0
);

create table threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  category_id uuid not null references categories(id),
  community_id uuid references communities(id),     -- null = thread umum
  title text not null check (char_length(title) between 5 and 150),
  body text not null check (char_length(body) <= 10000),
  tags text[] not null default '{}',
  media jsonb not null default '[]' check (jsonb_array_length(media) <= 8), -- [{type:'image'|'youtube'|'link', url}]
  status content_status not null default 'published',
  upvote_count int not null default 0,
  comment_count int not null default 0,
  share_count int not null default 0,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);
create index on threads (last_activity_at desc);
create index on threads (category_id, last_activity_at desc);
create index on threads (community_id, last_activity_at desc);
create index on threads (author_id);

create table comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  author_id uuid not null references profiles(id),
  parent_id uuid references comments(id) on delete cascade,  -- maks. 1 level (dicek di server)
  body text not null check (char_length(body) between 1 and 5000),
  media jsonb not null default '[]' check (jsonb_array_length(media) <= 4),
  status content_status not null default 'published',
  upvote_count int not null default 0,
  created_at timestamptz not null default now()
);
create index on comments (thread_id, created_at);

create table votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  thread_id uuid references threads(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((thread_id is null) <> (comment_id is null)),
  unique (user_id, thread_id),
  unique (user_id, comment_id)
);

create table shares (   -- dihitung sekali per pengguna per thread (untuk popularitas)
  user_id uuid references profiles(id) on delete cascade,
  thread_id uuid references threads(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, thread_id)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  thread_id uuid references threads(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  check ((thread_id is null) <> (comment_id is null)),
  unique (reporter_id, thread_id),
  unique (reporter_id, comment_id)
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot in ('strip', 'side')),
  title text not null, body text, link_url text, image_url text,
  active boolean not null default true,
  starts_at timestamptz, ends_at timestamptz,
  sort int not null default 0
);

create table filter_terms (   -- kata/domain terlarang, dibaca server (service role)
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('word', 'domain')),
  term text not null,
  unique (kind, term)
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null, target text, meta jsonb,
  created_at timestamptz not null default now()
);

-- Helper
create function is_super_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'super_admin' and status = 'active') $$;
create function is_active() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and status = 'active') $$;
create function is_member(c uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from community_members where community_id = c and user_id = auth.uid()) $$;

-- Penghitung andal lewat trigger
create function bump() returns trigger language plpgsql security definer set search_path = public as $$
declare r jsonb := to_jsonb(case when tg_op = 'DELETE' then old else new end);
        d int := case when tg_op = 'DELETE' then -1 else 1 end;
begin
  execute format('update %I set %I = %I + %s where id = %L', tg_argv[0], tg_argv[2], tg_argv[2], d, r ->> tg_argv[1]);
  return null;
end $$;
create trigger t_vote_thread  after insert or delete on votes    for each row execute function bump('threads', 'thread_id', 'upvote_count');
create trigger t_vote_comment after insert or delete on votes    for each row execute function bump('comments', 'comment_id', 'upvote_count');
create trigger t_comment_cnt  after insert or delete on comments for each row execute function bump('threads', 'thread_id', 'comment_count');
create trigger t_share_cnt    after insert or delete on shares    for each row execute function bump('threads', 'thread_id', 'share_count');
create trigger t_member_cnt   after insert or delete on community_members for each row execute function bump('communities', 'community_id', 'member_count');

-- Admin otomatis menjadi anggota saat komunitas dibuat
create function admin_joins() returns trigger language plpgsql security definer set search_path = public as
$$ begin insert into community_members (community_id, user_id) values (new.id, new.admin_id); return new; end $$;
create trigger t_admin_joins after insert on communities for each row execute function admin_joins();

-- Profil otomatis saat pendaftaran (email atau Google)
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(nullif(lower(new.raw_user_meta_data ->> 'username'), ''), 'user_' || substr(new.id::text, 1, 8)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Tampilan publik penulis (tamu hanya melihat nama dan avatar, bukan profil)
create view author_public as select id, username, avatar_url from profiles;
grant select on author_public to anon, authenticated;

-- RLS
alter table profiles enable row level security;
alter table communities enable row level security;
alter table community_members enable row level security;
alter table categories enable row level security;
alter table threads enable row level security;
alter table comments enable row level security;
alter table votes enable row level security;
alter table shares enable row level security;
alter table reports enable row level security;
alter table banners enable row level security;
alter table filter_terms enable row level security;
alter table audit_logs enable row level security;

-- Profil: hanya pengguna login; pengguna hanya bisa ubah username, avatar, bio miliknya
create policy profiles_read on profiles for select to authenticated using (true);
create policy profiles_update on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on profiles from authenticated;
grant update (username, avatar_url, bio) on profiles to authenticated;

-- Thread: publik (tamu boleh baca); tulis hanya akun aktif, thread komunitas hanya untuk anggota
create policy threads_read on threads for select to anon, authenticated
  using (status in ('published', 'locked') or author_id = auth.uid() or is_super_admin());
create policy threads_insert on threads for insert to authenticated
  with check (author_id = auth.uid() and is_active() and (community_id is null or is_member(community_id)));
create policy threads_update_own on threads for update to authenticated using (author_id = auth.uid() and status = 'published') with check (author_id = auth.uid() and status = 'published');
create policy threads_admin on threads for all to authenticated using (is_super_admin()) with check (is_super_admin());
create policy threads_delete_own on threads for delete to authenticated using (author_id = auth.uid());
revoke update on threads from authenticated;
grant update (title, body, tags, media, category_id) on threads to authenticated;

-- Komentar dan interaksi: hanya pengguna login
create policy comments_read on comments for select to authenticated using (status = 'published' or author_id = auth.uid() or is_super_admin());
create policy comments_insert on comments for insert to authenticated
  with check (author_id = auth.uid() and is_active()
    and exists (select 1 from threads t where t.id = thread_id and t.status = 'published'));
create policy comments_update_own on comments for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy comments_delete_own on comments for delete to authenticated using (author_id = auth.uid());
create policy comments_admin on comments for all to authenticated using (is_super_admin()) with check (is_super_admin());
revoke update on comments from authenticated;
grant update (body, media) on comments to authenticated;

create policy votes_own on votes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and is_active());
create policy shares_own on shares for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and is_active());

-- Komunitas
create policy communities_read on communities for select to anon, authenticated using (true);
create policy communities_admin on communities for all to authenticated using (is_super_admin()) with check (is_super_admin());
create policy communities_own on communities for update to authenticated using (admin_id = auth.uid()) with check (admin_id = auth.uid());
revoke update on communities from authenticated;
grant update (description, logo_url, banner_url, announcement, rules) on communities to authenticated;
create policy members_read on community_members for select to authenticated using (true);
create policy members_join on community_members for insert to authenticated with check (user_id = auth.uid() and is_active());
create policy members_leave on community_members for delete to authenticated
  using (user_id = auth.uid() and user_id <> (select admin_id from communities where id = community_id));

-- Konten referensi
create policy categories_read on categories for select to anon, authenticated using (true);
create policy categories_admin on categories for all to authenticated using (is_super_admin()) with check (is_super_admin());
create policy banners_read on banners for select to anon, authenticated using (active);
create policy banners_admin on banners for all to authenticated using (is_super_admin()) with check (is_super_admin());

-- Laporan dan data sensitif
create policy reports_insert on reports for insert to authenticated with check (reporter_id = auth.uid() and is_active());
create policy reports_admin on reports for all to authenticated using (is_super_admin()) with check (is_super_admin());
create policy filter_admin on filter_terms for all to authenticated using (is_super_admin()) with check (is_super_admin());
create policy audit_admin on audit_logs for select to authenticated using (is_super_admin());
