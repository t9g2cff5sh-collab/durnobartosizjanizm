alter table profiles
  add column if not exists credo text not null default '';
