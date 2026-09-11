create table if not exists day_log (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  body text not null,
  status text not null check (status in ('plan', 'zrobione', 'otwarte')),
  created_at timestamptz not null default now()
);
create index if not exists day_log_status_idx on day_log (status, created_at desc);

create table if not exists guests (
  id serial primary key,
  user_id text not null,
  nick text not null,
  channel text not null,
  status text not null check (status in ('czeka', 'wpuszczony', 'odmowa')),
  created_at timestamptz not null default now()
);
create index if not exists guests_created_idx on guests (created_at desc);

create table if not exists letters (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  body text not null,
  status text not null check (status in ('draft', 'sent')),
  created_at timestamptz not null default now()
);
create index if not exists letters_status_idx on letters (status, created_at desc);

create table if not exists rozumie (
  id serial primary key,
  user_id text not null,
  sentence text not null,
  reply text not null,
  created_at timestamptz not null default now()
);
create index if not exists rozumie_created_idx on rozumie (created_at desc);

create table if not exists surprise_draws (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  card text not null,
  created_at timestamptz not null default now()
);

create table if not exists shared_songs (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  lyrics text not null,
  bit text not null,
  status text not null check (status in ('draft', 'swiat')),
  created_at timestamptz not null default now()
);
create index if not exists shared_songs_created_idx on shared_songs (created_at desc);
