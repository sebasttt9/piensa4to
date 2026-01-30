-- Script para eliminar TODAS las foreign key constraints de inventory_items
-- Ejecutar en: https://nqkodrksdcmzhxoeuidj.supabase.co/project/nqkodrksdcmzhxoeuidj/sql

-- Eliminar TODAS las foreign key constraints de inventory_items
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE 'Buscando constraints para eliminar...';

    FOR constraint_record IN
        SELECT conname, conrelid::regclass as table_name
        FROM pg_constraint
        WHERE conrelid = 'inventory_items'::regclass
        AND contype = 'f'
    LOOP
        RAISE NOTICE 'Eliminando constraint: % de tabla %', constraint_record.conname, constraint_record.table_name;
        EXECUTE 'ALTER TABLE ' || constraint_record.table_name || ' DROP CONSTRAINT ' || constraint_record.conname;
    END LOOP;

    RAISE NOTICE 'Todas las foreign key constraints eliminadas';
END $$;

-- Verificar que no queden constraints
SELECT
    'Constraints restantes:' as info,
    conname as constraint_name,
    contype as type,
    conrelid::regclass as table_name
FROM pg_constraint
WHERE conrelid = 'inventory_items'::regclass;

-- Verificar estructura de la tabla
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE
    table_name = 'inventory_items'
ORDER BY ordinal_position;