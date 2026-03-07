-- Sangu TMS 2.0
-- Tenant DB schema v1
-- PostgreSQL dialect

create table if not exists branches (
  id uuid primary key,
  code varchar(20) not null unique,
  name varchar(120) not null,
  is_active boolean not null default true,
  is_deleted boolean not null default false
);

create table if not exists locations (
  id uuid primary key,
  code varchar(20) not null unique,
  name varchar(120) not null,
  state_name varchar(120),
  is_active boolean not null default true,
  is_deleted boolean not null default false
);

create table if not exists customers (
  id uuid primary key,
  code varchar(20) not null unique,
  name varchar(180) not null,
  gst_no varchar(20),
  mobile varchar(20),
  credit_days int not null default 0,
  is_active boolean not null default true,
  is_deleted boolean not null default false
);

create table if not exists roles (
  id uuid primary key,
  code varchar(40) not null unique,
  name varchar(80) not null
);

create table if not exists permissions (
  id uuid primary key,
  module_code varchar(40) not null,
  action_code varchar(40) not null,
  unique(module_code, action_code)
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key(role_id, permission_id)
);

create table if not exists app_users (
  id uuid primary key,
  branch_id uuid references branches(id),
  full_name varchar(120) not null,
  email varchar(180) not null unique,
  password_hash text not null,
  is_admin boolean not null default false,
  is_active boolean not null default true,
  last_login_at timestamptz
);

create table if not exists user_roles (
  user_id uuid not null references app_users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  primary key(user_id, role_id)
);

create table if not exists consignments (
  id uuid primary key,
  branch_id uuid not null references branches(id),
  consignment_no varchar(40) not null unique,
  booking_date date not null,
  customer_id uuid not null references customers(id),
  from_location_id uuid not null references locations(id),
  to_location_id uuid not null references locations(id),
  goods_description varchar(300),
  quantity numeric(14,3),
  weight_kg numeric(14,3),
  freight_amount numeric(14,2) not null default 0,
  status varchar(20) not null default 'Draft',
  remarks varchar(500),
  created_at timestamptz not null default now(),
  created_by uuid references app_users(id),
  updated_at timestamptz,
  updated_by uuid references app_users(id)
);

create table if not exists challans (
  id uuid primary key,
  branch_id uuid not null references branches(id),
  challan_no varchar(40) not null unique,
  challan_date date not null,
  consignment_id uuid not null references consignments(id),
  vehicle_no varchar(30),
  driver_name varchar(120),
  driver_mobile varchar(20),
  total_hire numeric(14,2) not null default 0,
  status varchar(20) not null default 'Open',
  created_at timestamptz not null default now(),
  created_by uuid references app_users(id),
  updated_at timestamptz,
  updated_by uuid references app_users(id)
);

create table if not exists lorry_payments (
  id uuid primary key,
  challan_id uuid not null references challans(id) on delete cascade,
  payment_date date not null,
  payment_type varchar(20) not null, -- part/balance
  amount numeric(14,2) not null,
  mode varchar(20) not null, -- cash/bank/upi
  reference_no varchar(80),
  notes varchar(400),
  created_at timestamptz not null default now(),
  created_by uuid references app_users(id)
);

create table if not exists invoices (
  id uuid primary key,
  branch_id uuid not null references branches(id),
  invoice_no varchar(40) not null unique,
  invoice_date date not null,
  consignment_id uuid not null references consignments(id),
  taxable_amount numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  due_date date,
  status varchar(20) not null default 'Draft',
  created_at timestamptz not null default now(),
  created_by uuid references app_users(id),
  updated_at timestamptz,
  updated_by uuid references app_users(id)
);

create table if not exists invoice_challans (
  invoice_id uuid not null references invoices(id) on delete cascade,
  challan_id uuid not null references challans(id) on delete restrict,
  primary key(invoice_id, challan_id)
);

create table if not exists money_receipts (
  id uuid primary key,
  branch_id uuid not null references branches(id),
  receipt_no varchar(40) not null unique,
  receipt_date date not null,
  invoice_id uuid not null references invoices(id),
  amount numeric(14,2) not null,
  mode varchar(20) not null, -- cash/bank/upi
  reference_no varchar(80),
  status varchar(20) not null default 'Posted',
  created_at timestamptz not null default now(),
  created_by uuid references app_users(id)
);

create index if not exists ix_consignments_booking_date on consignments(booking_date);
create index if not exists ix_challans_consignment on challans(consignment_id);
create index if not exists ix_lorry_payments_challan on lorry_payments(challan_id);
create index if not exists ix_invoices_consignment on invoices(consignment_id);
create index if not exists ix_money_receipts_invoice on money_receipts(invoice_id);

