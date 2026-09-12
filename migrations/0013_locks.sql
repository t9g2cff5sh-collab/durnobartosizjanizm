alter table guestbook
  add column if not exists status text not null default 'pieczec';

create table if not exists table_seat (
  id int primary key check (id = 1),
  name text not null,
  seated_at timestamptz not null default now()
);
insert into table_seat (id, name)
values (1, 'Pani Bozia')
on conflict (id) do nothing;
