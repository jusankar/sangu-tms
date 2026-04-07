BEGIN;

-- Normalize commonly misnamed traffic planning tables to canonical names.
DO $$
BEGIN
  IF to_regclass('public.traffic_plan_trailer') IS NOT NULL
     AND to_regclass('public.traffic_plan_trailers') IS NULL THEN
    ALTER TABLE public.traffic_plan_trailer RENAME TO traffic_plan_trailers;
  END IF;

  IF to_regclass('public.traffic_plan_item') IS NOT NULL
     AND to_regclass('public.traffic_plan_items') IS NULL THEN
    ALTER TABLE public.traffic_plan_item RENAME TO traffic_plan_items;
  END IF;

  IF to_regclass('public.traffic_plan_placement') IS NOT NULL
     AND to_regclass('public.traffic_plan_placements') IS NULL THEN
    ALTER TABLE public.traffic_plan_placement RENAME TO traffic_plan_placements;
  END IF;

  IF to_regclass('public.vehicle_placement_plans') IS NOT NULL
     AND to_regclass('public.traffic_plans') IS NULL THEN
    ALTER TABLE public.vehicle_placement_plans RENAME TO traffic_plans;
  END IF;
END
$$;

create table if not exists public.traffic_plans (
  id uuid primary key,
  recommended_trailer_type varchar(40),
  total_trailers int not null default 0,
  mode varchar(40),
  warnings_json jsonb,
  request_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.traffic_plan_trailers (
  id uuid primary key,
  plan_id uuid not null references public.traffic_plans(id) on delete cascade,
  trailer_index int not null,
  trailer_type varchar(40),
  total_weight numeric(14,2) not null default 0,
  trailer_length numeric(12,4) not null default 0,
  trailer_width numeric(12,4) not null default 0,
  trailer_height numeric(12,4) not null default 0
);

create table if not exists public.traffic_plan_items (
  id uuid primary key,
  trailer_id uuid not null references public.traffic_plan_trailers(id) on delete cascade,
  material_id varchar(40) not null,
  quantity int not null,
  stack_count int not null
);

create table if not exists public.traffic_plan_placements (
  id uuid primary key,
  trailer_id uuid not null references public.traffic_plan_trailers(id) on delete cascade,
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

alter table if exists public.traffic_plans
  add column if not exists recommended_trailer_type varchar(40),
  add column if not exists total_trailers int not null default 0,
  add column if not exists mode varchar(40),
  add column if not exists warnings_json jsonb,
  add column if not exists request_json jsonb,
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.traffic_plan_trailers
  add column if not exists plan_id uuid,
  add column if not exists trailer_index int,
  add column if not exists trailer_type varchar(40),
  add column if not exists total_weight numeric(14,2) not null default 0,
  add column if not exists trailer_length numeric(12,4) not null default 0,
  add column if not exists trailer_width numeric(12,4) not null default 0,
  add column if not exists trailer_height numeric(12,4) not null default 0;

alter table if exists public.traffic_plan_items
  add column if not exists trailer_id uuid,
  add column if not exists material_id varchar(40),
  add column if not exists quantity int,
  add column if not exists stack_count int;

alter table if exists public.traffic_plan_placements
  add column if not exists trailer_id uuid,
  add column if not exists material_id varchar(40),
  add column if not exists quantity int,
  add column if not exists stack_count int,
  add column if not exists x numeric(12,4),
  add column if not exists y numeric(12,4),
  add column if not exists z numeric(12,4),
  add column if not exists length numeric(12,4),
  add column if not exists width numeric(12,4),
  add column if not exists height numeric(12,4),
  add column if not exists weight numeric(14,4);

-- Fix typo column names if they exist.
DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'traffic_plan_placements' AND column_name = 'meterial_id'
  ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'traffic_plan_placements' AND column_name = 'material_id'
  ) THEN
    ALTER TABLE public.traffic_plan_placements RENAME COLUMN meterial_id TO material_id;
  END IF;
END
$$;

-- Rebuild placements table when old incompatible types are present.
DO $$
DECLARE
  rebuild_needed boolean := false;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'traffic_plan_placements' AND (
      (column_name = 'id' AND data_type <> 'uuid') OR
      (column_name = 'material_id' AND data_type <> 'character varying') OR
      (column_name IN ('x','y','z','length','width','height','weight') AND data_type IN ('smallint','integer','bigint'))
    )
  ) THEN
    rebuild_needed := true;
  END IF;

  IF rebuild_needed THEN
    ALTER TABLE public.traffic_plan_placements RENAME TO traffic_plan_placements_legacy_20260321;

    CREATE TABLE public.traffic_plan_placements (
      id uuid primary key,
      trailer_id uuid not null references public.traffic_plan_trailers(id) on delete cascade,
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

    INSERT INTO public.traffic_plan_placements (
      id, trailer_id, material_id, quantity, stack_count, x, y, z, length, width, height, weight
    )
    SELECT
      gen_random_uuid(),
      COALESCE(
        l.trailer_id,
        (
          SELECT t.id
          FROM public.traffic_plan_trailers t
          WHERE t.plan_id = l.plan_id
          ORDER BY t.trailer_index
          LIMIT 1
        )
      ) AS trailer_id,
      LEFT(COALESCE(l.material_id::text, ''), 40) AS material_id,
      COALESCE(l.quantity, 0),
      COALESCE(l.stack_count, 0),
      COALESCE(l.x::numeric, 0),
      COALESCE(l.y::numeric, 0),
      COALESCE(l.z::numeric, 0),
      COALESCE(l.length::numeric, 0),
      COALESCE(l.width::numeric, 0),
      COALESCE(l.height::numeric, 0),
      COALESCE(l.weight::numeric, 0)
    FROM public.traffic_plan_placements_legacy_20260321 l
    WHERE COALESCE(
      l.trailer_id,
      (
        SELECT t.id
        FROM public.traffic_plan_trailers t
        WHERE t.plan_id = l.plan_id
        ORDER BY t.trailer_index
        LIMIT 1
      )
    ) IS NOT NULL;
  END IF;
END
$$;

-- Ensure foreign keys are present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_traffic_plan_trailers_plan'
  ) THEN
    ALTER TABLE public.traffic_plan_trailers
      ADD CONSTRAINT fk_traffic_plan_trailers_plan
      FOREIGN KEY (plan_id) REFERENCES public.traffic_plans(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_traffic_plan_items_trailer'
  ) THEN
    ALTER TABLE public.traffic_plan_items
      ADD CONSTRAINT fk_traffic_plan_items_trailer
      FOREIGN KEY (trailer_id) REFERENCES public.traffic_plan_trailers(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_traffic_plan_placements_trailer'
  ) THEN
    ALTER TABLE public.traffic_plan_placements
      ADD CONSTRAINT fk_traffic_plan_placements_trailer
      FOREIGN KEY (trailer_id) REFERENCES public.traffic_plan_trailers(id) ON DELETE CASCADE;
  END IF;
END
$$;

create index if not exists ix_traffic_plan_trailers_plan on public.traffic_plan_trailers(plan_id);
create index if not exists ix_traffic_plan_items_trailer on public.traffic_plan_items(trailer_id);
create index if not exists ix_traffic_plan_placements_trailer on public.traffic_plan_placements(trailer_id);

COMMIT;

