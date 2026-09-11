create table if not exists host_seat (
  id int primary key check (id = 1),
  name text not null,
  seated_at timestamptz not null default now()
);
insert into host_seat (id, name)
values (1, 'Monitor')
on conflict (id) do nothing;

create table if not exists preemptions (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  kind text not null check (kind in ('kawalek', 'projekt', 'miejsce', 'wyjazd', 'inne')),
  title text not null,
  song_id int,
  status text not null check (status in ('czeka', 'wzial', 'oddane')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists preemptions_status_idx on preemptions (status, created_at desc);
