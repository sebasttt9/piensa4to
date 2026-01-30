-- Script para la base de datos de datos: nqkodrksdcmzhxoeuidj

-- Limpiar
DROP TABLE IF EXISTS public.inventory_items CASCADE;

DROP TABLE IF EXISTS public.inventory_adjustments CASCADE;

DROP TABLE IF EXISTS public.dashboard_shares CASCADE;

DROP TABLE IF EXISTS public.dashboards CASCADE;

DROP TABLE IF EXISTS public.datasets CASCADE;

DROP FUNCTION IF EXISTS public.set_updated_at () CASCADE;

-- Recrear extensión
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear tabla de datasets
CREATE TABLE IF NOT EXISTS public.datasets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL,
    name text NOT NULL,
    description text NULL,
    filename text NULL,
    file_size bigint NULL,
    file_type text NULL,
    row_count integer NULL,
    column_count integer NULL,
    analysis jsonb NULL,
    preview jsonb NOT NULL DEFAULT '[]'::jsonb,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'error')),
    tags text[] NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER datasets_set_updated_at
BEFORE UPDATE ON public.datasets
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Recrear tabla de dashboards
CREATE TABLE IF NOT EXISTS public.dashboards (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL,
    name text NOT NULL,
    description text NULL,
    dataset_ids uuid[] NOT NULL DEFAULT '{}',
    layout jsonb NOT NULL DEFAULT '{}'::jsonb,
    charts jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_public boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS dashboards_set_updated_at ON public.dashboards;

CREATE TRIGGER dashboards_set_updated_at
BEFORE UPDATE ON public.dashboards
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Recrear tabla de dashboard_shares
CREATE TABLE IF NOT EXISTS public.dashboard_shares (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    dashboard_id uuid NOT NULL REFERENCES public.dashboards (id) ON DELETE CASCADE,
    owner_id uuid NOT NULL,
    channel text NOT NULL CHECK (channel IN ('email', 'sms')),
    contact text NOT NULL,
    message text NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'sent', 'failed')
    ),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Recrear tabla de inventory_adjustments
CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    owner_id uuid NOT NULL,
    dataset_id uuid NOT NULL REFERENCES public.datasets (id) ON DELETE CASCADE,
    adjustment integer NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT inventory_adjustments_owner_dataset_unique UNIQUE (owner_id, dataset_id)
);

CREATE TRIGGER inventory_adjustments_set_updated_at
BEFORE UPDATE ON public.inventory_adjustments
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Nueva tabla para items de inventario
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    owner_id uuid NOT NULL,
    dataset_id uuid REFERENCES public.datasets (id) ON DELETE SET NULL,
    dashboard_id uuid REFERENCES public.dashboards (id) ON DELETE SET NULL,
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    pvp decimal(10, 2) NOT NULL CHECK (pvp >= 0),
    cost decimal(10, 2) NOT NULL CHECK (cost >= 0),
    status text NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'approved',
            'rejected'
        )
    ),
    approved_by uuid,
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS inventory_items_set_updated_at ON public.inventory_items;

CREATE TRIGGER inventory_items_set_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Habilitar RLS en las tablas de datos
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dashboard_shares ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Políticas para datasets
DROP POLICY IF EXISTS "Owners can manage datasets" ON public.datasets;

CREATE POLICY "Owners can manage datasets" ON public.datasets FOR ALL USING (auth.uid () = owner_id);

DROP POLICY IF EXISTS "Admins can view datasets" ON public.datasets;

CREATE POLICY "Admins can view datasets" ON public.datasets FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE
                id = auth.uid ()
                AND role IN ('admin', 'superadmin')
        )
    );

-- Políticas para inventory_adjustments
DROP POLICY IF EXISTS "Owners manage inventory adjustments" ON public.inventory_adjustments;

CREATE POLICY "Owners manage inventory adjustments" ON public.inventory_adjustments FOR ALL USING (auth.uid () = owner_id);

-- Políticas para inventory_items
DROP POLICY IF EXISTS "Users can create inventory items" ON public.inventory_items;

CREATE POLICY "Users can create inventory items" ON public.inventory_items FOR
INSERT
WITH
    CHECK (auth.uid () = owner_id);

DROP POLICY IF EXISTS "Users can view own inventory items" ON public.inventory_items;

CREATE POLICY "Users can view own inventory items" ON public.inventory_items FOR
SELECT USING (auth.uid () = owner_id);

DROP POLICY IF EXISTS "Admins can view all inventory items" ON public.inventory_items;

CREATE POLICY "Admins can view all inventory items" ON public.inventory_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE
                id = auth.uid ()
                AND role IN ('admin', 'superadmin')
        )
    );

DROP POLICY IF EXISTS "Users can update own pending items" ON public.inventory_items;

CREATE POLICY "Users can update own pending items" ON public.inventory_items FOR
UPDATE USING (
    auth.uid () = owner_id
    AND status = 'pending'
);

DROP POLICY IF EXISTS "Admins can update all inventory items" ON public.inventory_items;

CREATE POLICY "Admins can update all inventory items" ON public.inventory_items FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'superadmin')
    )
);

DROP POLICY IF EXISTS "Users can delete own pending items" ON public.inventory_items;

CREATE POLICY "Users can delete own pending items" ON public.inventory_items FOR DELETE USING (
    auth.uid () = owner_id
    AND status = 'pending'
);

DROP POLICY IF EXISTS "Admins can delete any inventory items" ON public.inventory_items;

CREATE POLICY "Admins can delete any inventory items" ON public.inventory_items FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'superadmin')
    )
);

-- Políticas para dashboards
DROP POLICY IF EXISTS "Owners can manage dashboards" ON public.dashboards;

CREATE POLICY "Owners can manage dashboards" ON public.dashboards FOR ALL USING (auth.uid () = owner_id);

DROP POLICY IF EXISTS "Admins can view dashboards" ON public.dashboards;

CREATE POLICY "Admins can view dashboards" ON public.dashboards FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE
                id = auth.uid ()
                AND role IN ('admin', 'superadmin')
        )
    );

-- Políticas para dashboard_shares
DROP POLICY IF EXISTS "Owners can manage dashboard shares" ON public.dashboard_shares;

CREATE POLICY "Owners can manage dashboard shares" ON public.dashboard_shares FOR ALL USING (auth.uid () = owner_id);