-- Script para la base de datos de usuarios: bggsqbvrpenahcppvuyc

-- Limpiar
DROP TABLE IF EXISTS public.users CASCADE;

DROP FUNCTION IF EXISTS public.set_updated_at () CASCADE;

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
    approved boolean NOT NULL DEFAULT false,
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
DROP TRIGGER IF EXISTS users_set_updated_at ON public.users;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO
    public.users (
        email,
        name,
        role,
        password_hash,
        approved
    )
VALUES (
        'demo.user@datapulse.local',
        'Demo Usuario',
        'user',
        '$2b$12$SB7c8cXKyNEf4x2yL0fZz.oRKUk3.Qt5QKZDZgftCu7D3fqfq2q6K',
        true
    ),
    (
        'demo.admin@datapulse.local',
        'Demo Administrador',
        'admin',
        '$2b$12$cYiVZC1oG5LV0pOwfqso6OGq20JhhbAoeQ0Os75mjufOIiGA.HEcG',
        true
    ),
    (
        'demo.superadmin@datapulse.local',
        'Demo Superadmin',
        'superadmin',
        '$2b$12$JJ0jFQQSXJxnUTYAnBzjp.BKc4RMn4g9gBNYzzCTgO0NpXBKTl4vG',
        true
    ) ON CONFLICT (email) DO NOTHING;

-- Habilitar RLS en users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas para users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users FOR
SELECT USING (auth.uid () = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

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

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (auth.uid () = id);

DROP POLICY IF EXISTS "Admins can update users" ON public.users;

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