-- Script para asignar organizaciones a usuarios existentes
-- Este script debe ejecutarse en la base de datos de datos (SUPABASE_DATA_CLIENT)

-- Primero, crear algunas organizaciones de ejemplo si no existen
INSERT INTO
    organizations (id, name, description)
VALUES (
        'org-1',
        'Empresa ABC',
        'Organización de ejemplo 1'
    ),
    (
        'org-2',
        'Empresa XYZ',
        'Organización de ejemplo 2'
    ),
    (
        'org-3',
        'Empresa 123',
        'Organización de ejemplo 3'
    ) ON CONFLICT (id) DO NOTHING;

-- Asignar todos los usuarios existentes a la primera organización por defecto
-- Solo si no tienen organization_id asignado
UPDATE users
SET
    organization_id = 'org-1'
WHERE
    organization_id IS NULL;

-- Verificar la asignación
SELECT u.email, u.role, o.name as organization_name
FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
ORDER BY u.created_at;