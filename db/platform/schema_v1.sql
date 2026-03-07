-- Sangu TMS 2.0
-- Platform DB schema v1
-- PostgreSQL dialect

create table if not exists tenants (
  id uuid primary key,
  code varchar(32) unique not null,
  company_name varchar(200) not null,
  db_connection_encrypted text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists plans (
  id uuid primary key,
  code varchar(32) unique not null,
  name varchar(100) not null,
  monthly_price_inr numeric(12,2) not null,
  included_users int not null,
  included_admins int not null,
  included_consignments int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  plan_id uuid not null references plans(id),
  status varchar(20) not null, -- active, grace, suspended, expired
  start_date date not null,
  end_date date not null,
  grace_end_date date,
  auto_renew boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usage_counters (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  period_yyyy_mm varchar(7) not null, -- 2026-03
  consignments_count int not null default 0,
  users_count int not null default 0,
  admins_count int not null default 0,
  unique (tenant_id, period_yyyy_mm)
);

create table if not exists billing_transactions (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  subscription_id uuid not null references subscriptions(id),
  provider varchar(30) not null, -- razorpay/stripe/manual
  provider_payment_id varchar(120),
  amount numeric(12,2) not null,
  currency varchar(8) not null default 'INR',
  status varchar(20) not null, -- created, paid, failed, refunded
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists license_events (
  id uuid primary key,
  tenant_id uuid not null references tenants(id),
  event_type varchar(40) not null, -- plan_changed, suspended, renewed, over_quota
  event_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ix_subscriptions_tenant on subscriptions(tenant_id);
create index if not exists ix_usage_tenant_period on usage_counters(tenant_id, period_yyyy_mm);
create index if not exists ix_billing_tenant on billing_transactions(tenant_id);

