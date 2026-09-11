create table if not exists company_account (
  id integer primary key check (id = 1),
  label text not null default 'Konto firmowe',
  balance integer not null default 0
);

insert into company_account (id, label, balance)
values (1, 'Konto firmowe', 0)
on conflict (id) do nothing;

update company_account
set balance = (
  select count(*)::int * 10
  from dues
  where status = 'paid'
    and user_id not in (select founder_user_id from domain_claim where id = 1)
)
where id = 1
  and balance = 0;

create table if not exists cause_pot (
  id integer primary key check (id = 1),
  balance integer not null default 0
);

insert into cause_pot (id, balance) values (1, 0)
on conflict (id) do nothing;

create table if not exists causes (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists cause_votes (
  user_id text primary key,
  cause_id integer not null references causes (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id serial primary key,
  user_id text not null,
  author_name text not null,
  title text not null,
  body text not null default '',
  earned integer not null,
  status text not null check (status in ('tok', 'gotowe')),
  tithe integer not null default 0,
  net integer not null default 0,
  cause_title text not null default '',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists projects_status_idx on projects (status, created_at desc);
