-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Users table (authentication metadata)
create table if not exists public.users (
    id uuid primary key default uuid_generate_v4 (),
    email text unique not null,
    name text not null,
    role text not null check (
        role in ('user', 'admin', 'superadmin')
    ),
    password_hash text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Utility trigger to keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Datasets table
create table if not exists public.datasets (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid not null,
    name text not null,
    description text null,
    filename text null,
    file_size bigint null,
    file_type text null,
    row_count integer null,
    column_count integer null,
    analysis jsonb null,
    preview jsonb not null default '[]'::jsonb,
    status text not null default 'pending' check (status in ('pending', 'processed', 'error')),
    tags text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger datasets_set_updated_at
before update on public.datasets
for each row execute procedure public.set_updated_at();

-- Dashboards table
create table if not exists public.dashboards (
    id uuid primary key default uuid_generate_v4(),
    owner_id uuid not null,
    name text not null,
    description text null,
    dataset_ids uuid[] not null default '{}',
    layout jsonb not null default '{}'::jsonb,
    charts jsonb not null default '[]'::jsonb,
    is_public boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger dashboards_set_updated_at
before update on public.dashboards
for each row execute procedure public.set_updated_at();

-- Dashboard sharing table
create table if not exists public.dashboard_shares (
    id uuid primary key default uuid_generate_v4 (),
    dashboard_id uuid not null,
    owner_id uuid not null,
    channel text not null check (channel in ('email', 'sms')),
    contact text not null,
    message text null,
    status text not null default 'pending' check (
        status in ('pending', 'sent', 'failed')
    ),
    created_at timestamptz not null default now()
);

-- Inventory adjustments table
create table if not exists public.inventory_adjustments (
    id uuid primary key default uuid_generate_v4 (),
    owner_id uuid not null,
    dataset_id uuid not null,
    adjustment integer not null,
    updated_at timestamptz not null default now(),
    constraint inventory_adjustments_owner_dataset_unique unique (owner_id, dataset_id)
);

create trigger inventory_adjustments_set_updated_at
before update on public.inventory_adjustments
for each row execute procedure public.set_updated_at();