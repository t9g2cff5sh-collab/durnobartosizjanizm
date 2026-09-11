alter table company_account add column if not exists holder text not null default '';
alter table company_account add column if not exists last4 text not null default '';
alter table company_account add column if not exists iban text not null default '';
