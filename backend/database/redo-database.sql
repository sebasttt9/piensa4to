-- Script para rehacer la base de datos con roles de usuario
-- Ejecutar en el SQL Editor de Supabase

-- Primero, eliminar tablas existentes (en orden inverso de dependencias)
DROP TABLE IF EXISTS public.inventory_adjustments CASCADE;

DROP TABLE IF EXISTS public.dashboard_shares CASCADE;

DROP TABLE IF EXISTS public.dashboards CASCADE;

DROP TABLE IF EXISTS public.datasets CASCADE;

DROP TABLE IF EXISTS public.users CASCADE;

-- Eliminar función si existe
DROP FUNCTION IF EXISTS public.set_updated_at () CASCADE;

-- Eliminar extensión si es necesario (opcional, ya que se recreará)
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- Recrear extensión
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recrear tabla de usuarios con roles
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    role text NOT NULL CHECK (
        role IN ('user', 'admin', 'superadmin')
    ),
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para users
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Recrear tabla de datasets
CREATE TABLE IF NOT EXISTS public.datasets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
    owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NULL,
    dataset_ids uuid[] NOT NULL DEFAULT '{}',
    layout jsonb NOT NULL DEFAULT '{}'::jsonb,
    charts jsonb NOT NULL DEFAULT '[]'::jsonb,
    is_public boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER dashboards_set_updated_at
BEFORE UPDATE ON public.dashboards
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Recrear tabla de dashboard_shares
CREATE TABLE IF NOT EXISTS public.dashboard_shares (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
    dashboard_id uuid NOT NULL REFERENCES public.dashboards (id) ON DELETE CASCADE,
    owner_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
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
    owner_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
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
    owner_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    dataset_id uuid REFERENCES public.datasets (id) ON DELETE SET NULL,
    dashboard_id uuid REFERENCES public.dashboards (id) ON DELETE SET NULL,
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    pvp decimal(10, 2) NOT NULL CHECK (pvp >= 0),
    cost decimal(10, 2) NOT NULL CHECK (cost >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER inventory_items_set_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Insertar usuarios demo (opcional, puedes ejecutar el seed-demo-users.sql después)
-- Aquí se incluye para completar el script
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO
    public.users (
        email,
        name,
        role,
        password_hash
    )
VALUES (
        'demo.user@datapulse.local',
        'Demo Usuario',
        'user',
        crypt (
            'DemoUser123!',
            gen_salt ('bf', 12)
        )
    ),
    (
        'demo.admin@datapulse.local',
        'Demo Administrador',
        'admin',
        crypt (
            'DemoAdmin123!',
            gen_salt ('bf', 12)
        )
    ),
    (
        'demo.superadmin@datapulse.local',
        'Demo Superadmin',
        'superadmin',
        crypt (
            'DemoRoot123!',
            gen_salt ('bf', 12)
        )
    ) ON CONFLICT (email) DO NOTHING;

-- Políticas RLS (Row Level Security) para controlar acceso por roles
-- Habilitar RLS en las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dashboard_shares ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Políticas para users: Los usuarios solo pueden ver/editar su propio perfil, admins pueden ver todos, superadmin todo
CREATE POLICY "Users can view own profile" ON public.users FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Admins can view all users" ON public.users FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.users
            WHERE
                id = auth.uid ()
                AND role IN ('admin', 'superadmin')
        )
    );

CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (auth.uid () = id);

CREATE POLICY "Admins can update users" ON public.users FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE
            id = auth.uid ()
            AND role IN ('admin', 'superadmin')
    )
);

-- Políticas para datasets: Propietarios pueden hacer todo, admins pueden ver
CREATE POLICY "Owners can manage datasets" ON public.datasets FOR ALL USING (auth.uid () = owner_id);

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

-- Políticas para inventory_adjustments: Owners manage
CREATE POLICY "Owners manage inventory adjustments" ON public.inventory_adjustments FOR ALL USING (auth.uid () = owner_id);

-- Políticas para inventory_items: Owners manage
CREATE POLICY "Owners manage inventory items" ON public.inventory_items FOR ALL USING (auth.uid () = owner_id);

-- Nota: Después de ejecutar este script, ve a Supabase Dashboard > Settings > API > Reload Schema para actualizar el caché.