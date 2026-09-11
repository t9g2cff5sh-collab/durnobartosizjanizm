-- Singleton claim: the first account to insert this row is the domain founder.
create table if not exists domain_claim (
  id integer primary key check (id = 1),
  founder_user_id text not null unique,
  claimed_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id text primary key,
  role text not null check (role in ('founder', 'member')),
  display_name text not null,
  handle text not null default '',
  title text not null default '',
  manifesto text not null default '',
  location text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists links (
  id serial primary key,
  user_id text not null,
  label text not null,
  url text not null,
  sort_order integer not null default 0
);
create index if not exists links_user_id_idx on links (user_id);

create table if not exists notes (
  id serial primary key,
  user_id text not null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists notes_user_id_idx on notes (user_id);

create table if not exists guestbook (
  id serial primary key,
  user_id text not null,
  display_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists guestbook_created_at_idx on guestbook (created_at desc);
