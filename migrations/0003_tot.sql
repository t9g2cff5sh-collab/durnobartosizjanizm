create table if not exists tot_cards (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  title text not null,
  body text not null default '',
  column_id text not null check (column_id in ('iskry', 'tok', 'czeka', 'gotowe')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists tot_cards_column_idx on tot_cards (column_id, sort_order, id);
