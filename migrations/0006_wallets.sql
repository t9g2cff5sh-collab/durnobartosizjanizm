create table if not exists wallets (
  user_id text primary key,
  balance integer not null default 10
);

insert into wallets (user_id, balance)
select user_id, 10 from profiles
on conflict (user_id) do nothing;

update wallets w
set balance = 0
from dues d
where d.user_id = w.user_id
  and d.status = 'paid'
  and d.user_id not in (
    select founder_user_id from domain_claim where id = 1
  );
