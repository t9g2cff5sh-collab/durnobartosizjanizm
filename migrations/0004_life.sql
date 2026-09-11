create table if not exists notices (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  kind text not null check (kind in ('wyjazd', 'zaproszenie')),
  title text not null,
  body text not null default '',
  place text not null default '',
  when_text text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists notices_kind_idx on notices (kind, created_at desc);

create table if not exists tracks (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  title text not null,
  mime text not null,
  duration_ms integer not null,
  audio_b64 text not null,
  created_at timestamptz not null default now()
);
create index if not exists tracks_created_idx on tracks (created_at desc);
