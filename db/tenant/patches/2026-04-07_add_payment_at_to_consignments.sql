alter table if exists consignments
  add column if not exists payment_at varchar(120);

