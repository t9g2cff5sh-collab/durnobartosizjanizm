alter table notices add column if not exists updated_at timestamptz;
alter table tot_cards add column if not exists updated_at timestamptz;
alter table tracks add column if not exists updated_at timestamptz;
