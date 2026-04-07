-- Sangu TMS 2.0
-- Tenant DB schema v1
-- PostgreSQL dialect

create table if not exists branches (
  id uuid primary key,
  code varchar(20) not null unique,
  name varchar(120) not null,
  address varchar(300),
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
  address varchar(300),
  gst_no varchar(20),
  mobile varchar(20),
  credit_days int not null default 0,
  is_active boolean not null default true,
  is_deleted boolean not null default false
);
create table if not exists drivers (
  id uuid primary key,
  name varchar(120) not null,
  license_no varchar(60) not null unique,
  date_of_birth date,
  address varchar(300),
  blood_group varchar(10),
  mobile varchar(20),
  is_active boolean not null default true,
  is_deleted boolean not null default false
);

create table if not exists vehicles (
  id uuid primary key,
  vehicle_number varchar(30) not null unique,
  make varchar(80),
  type varchar(80),
  chassis_number varchar(80),
  engine_number varchar(80),
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
  consignor_name varchar(180),
  consignor_address varchar(300),
  consignee_name varchar(180),
  consignee_address varchar(300),
  consignor_gst_no varchar(20),
  consignee_gst_no varchar(20),
  delivery_office_address varchar(300),
  gst_payable_by varchar(40),
  vehicle_no varchar(30),
  private_mark_no varchar(40),
  packages int not null default 0,
  goods_description varchar(300),
  quantity numeric(14,3),
  weight_kg numeric(14,3),
  actual_weight numeric(14,3) not null default 0,
  charged_weight numeric(14,3) not null default 0,
  rate_per_quintal numeric(14,2) not null default 0,
  basic_freight numeric(14,2) not null default 0,
  st_charge numeric(14,2) not null default 0,
  gst_amount numeric(14,2) not null default 0,
  hamali_charge numeric(14,2) not null default 0,
  door_delivery_charge numeric(14,2) not null default 0,
  advance_paid numeric(14,2) not null default 0,
  collection_charge numeric(14,2) not null default 0,
  payment_basis varchar(40),
  invoice_no varchar(40),
  invoice_date date,
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
  from_location_id uuid references locations(id),
  to_location_id uuid references locations(id),
  driver_id uuid references drivers(id),
  vehicle_id uuid references vehicles(id),
  owner_name varchar(180),
  vehicle_no varchar(30),
  driver_name varchar(120),
  driver_license_no varchar(60),
  driver_mobile varchar(20),
  balance_at varchar(40),
  freight_amount numeric(14,2) not null default 0,
  total_hire numeric(14,2) not null default 0,
  ref_balance numeric(14,2) not null default 0,
  advance_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  status varchar(20) not null default 'Open',
  created_at timestamptz not null default now(),
  created_by uuid references app_users(id),
  updated_at timestamptz,
  updated_by uuid references app_users(id)
);

create table if not exists challan_consignments (
  id uuid primary key,
  challan_id uuid not null references challans(id) on delete cascade,
  consignment_id uuid references consignments(id),
  consignor_name varchar(180),
  station_name varchar(120),
  packages int not null default 0,
  lr_no varchar(60),
  weight_kg numeric(14,3) not null default 0,
  description varchar(300),
  freight_amount numeric(14,2) not null default 0
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
  received_amount numeric(14,2) not null default 0,
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
create index if not exists ix_challan_consignments_challan on challan_consignments(challan_id);
create index if not exists ix_challan_consignments_consignment on challan_consignments(consignment_id);
create index if not exists ix_lorry_payments_challan on lorry_payments(challan_id);
create index if not exists ix_invoices_consignment on invoices(consignment_id);
create index if not exists ix_money_receipts_invoice on money_receipts(invoice_id);
create table if not exists traffic_plans (
  id uuid primary key,
  recommended_trailer_type varchar(40),
  total_trailers int not null default 0,
  mode varchar(40),
  warnings_json jsonb,
  request_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists traffic_plan_trailers (
  id uuid primary key,
  plan_id uuid not null references traffic_plans(id) on delete cascade,
  trailer_index int not null,
  trailer_type varchar(40),
  total_weight numeric(14,2) not null default 0,
  trailer_length numeric(12,4) not null default 0,
  trailer_width numeric(12,4) not null default 0,
  trailer_height numeric(12,4) not null default 0
);

create table if not exists traffic_plan_items (
  id uuid primary key,
  trailer_id uuid not null references traffic_plan_trailers(id) on delete cascade,
  material_id varchar(40) not null,
  quantity int not null,
  stack_count int not null
);

create table if not exists traffic_plan_placements (
  id uuid primary key,
  trailer_id uuid not null references traffic_plan_trailers(id) on delete cascade,
  material_id varchar(40) not null,
  quantity int not null,
  stack_count int not null,
  x numeric(12,4) not null,
  y numeric(12,4) not null,
  z numeric(12,4) not null,
  length numeric(12,4) not null,
  width numeric(12,4) not null,
  height numeric(12,4) not null,
  weight numeric(14,4) not null
);


create index if not exists ix_traffic_plan_trailers_plan on traffic_plan_trailers(plan_id);
create index if not exists ix_traffic_plan_items_trailer on traffic_plan_items(trailer_id);
create index if not exists ix_traffic_plan_placements_trailer on traffic_plan_placements(trailer_id);

