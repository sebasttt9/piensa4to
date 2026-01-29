-- Script para verificar y crear la tabla inventory_items si no existe
-- Ejecutar en Supabase SQL Editor

-- Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
        -- Crear la tabla si no existe
        CREATE TABLE public.inventory_items (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4 (),
            owner_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
            dataset_id uuid REFERENCES public.datasets (id) ON DELETE SET NULL,
            dashboard_id uuid REFERENCES public.dashboards (id) ON DELETE SET NULL,
            name text NOT NULL,
            code text UNIQUE NOT NULL,
            quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
            pvp decimal(10, 2) NOT NULL CHECK (pvp >= 0),
            cost decimal(10, 2) NOT NULL CHECK (cost >= 0),
            status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
            approved_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
            approved_at timestamptz,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );

        -- Crear trigger para updated_at
        CREATE TRIGGER inventory_items_set_updated_at
        BEFORE UPDATE ON public.inventory_items
        FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

        RAISE NOTICE 'Tabla inventory_items creada exitosamente';
    ELSE
        RAISE NOTICE 'La tabla inventory_items ya existe';
    END IF;
END $$;