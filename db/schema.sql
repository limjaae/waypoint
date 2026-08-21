-- Waypoint schema
-- Mirrors the ontology in the PRD: Location -> Asset -> Work Order -> Crew -> Assignment -> Decision
-- Run against a Supabase project. RLS is on everywhere; anon key gets read access to
-- reference data and insert access to assignments/decisions, matching Meridian's pattern.

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  region text not null
);

create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id),
  name text not null,
  asset_type text not null,
  criticality text not null check (criticality in ('low', 'medium', 'high')),
  condition text not null check (condition in ('normal', 'degraded', 'critical')),
  replacement_cost numeric,
  last_maintenance date
);

create table if not exists crews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location_id uuid not null references locations(id),
  skills text[] not null default '{}',
  certifications text[] not null default '{}',
  availability text not null check (availability in ('available', 'busy', 'off_shift')),
  current_workload text not null check (current_workload in ('low', 'medium', 'high'))
);

create table if not exists work_orders (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id),
  issue_type text not null,
  priority text not null check (priority in ('critical', 'high', 'medium', 'low')),
  status text not null default 'open' check (status in ('open', 'assigned', 'in_progress', 'blocked', 'complete')),
  required_capability text not null,
  customer_impact integer not null default 0,
  estimated_duration_hours numeric not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id),
  crew_id uuid not null references crews(id),
  status text not null default 'assigned' check (status in ('assigned', 'in_progress', 'blocked', 'complete')),
  blocked_reason text,
  assigned_at timestamptz not null default now(),
  estimated_completion timestamptz
);

create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references work_orders(id),
  crew_id uuid not null references crews(id),
  decision_maker text not null,
  reasoning text not null,
  score_breakdown jsonb,
  created_at timestamptz not null default now()
);

alter table locations enable row level security;
alter table assets enable row level security;
alter table crews enable row level security;
alter table work_orders enable row level security;
alter table assignments enable row level security;
alter table decisions enable row level security;

create policy "anon read locations" on locations for select using (true);
create policy "anon read assets" on assets for select using (true);
create policy "anon read crews" on crews for select using (true);
create policy "anon read work_orders" on work_orders for select using (true);
create policy "anon read assignments" on assignments for select using (true);
create policy "anon read decisions" on decisions for select using (true);

create policy "anon insert assignments" on assignments for insert with check (true);
create policy "anon update assignments" on assignments for update using (true);
create policy "anon insert decisions" on decisions for insert with check (true);
