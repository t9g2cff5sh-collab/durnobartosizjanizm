create table if not exists dues (
  user_id text primary key,
  status text not null check (status in ('unpaid', 'paid')),
  amount_groszy integer not null default 1000,
  currency text not null default 'PLN',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

insert into dues (user_id, status, amount_groszy, currency, paid_at)
select founder_user_id, 'paid', 1000, 'PLN', claimed_at
from domain_claim
where id = 1
on conflict (user_id) do nothing;
