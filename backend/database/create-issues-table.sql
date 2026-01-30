-- Script para limpiar y recrear la tabla issues en Supabase
-- Ejecutar este script en la base de datos de producción

-- Paso 1: Eliminar tabla y tipos existentes si existen
DROP TABLE IF EXISTS issues CASCADE;

DROP TYPE IF EXISTS issue_type CASCADE;

DROP TYPE IF EXISTS issue_status CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column () CASCADE;

-- Paso 2: Crear tipos ENUM
CREATE TYPE issue_type AS ENUM ('compra', 'devolucion', 'error_logistico', 'otro');

CREATE TYPE issue_status AS ENUM ('pendiente', 'resuelto', 'cancelado');

-- Paso 3: Crear tabla issues
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    type issue_type NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2),
    status issue_status DEFAULT 'pendiente',
    "createdById" UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    "inventoryItemId" UUID REFERENCES inventory_items (id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Paso 4: Crear índices para mejor rendimiento
CREATE INDEX idx_issues_type ON issues(type);

CREATE INDEX idx_issues_status ON issues (status);

CREATE INDEX idx_issues_created_by ON issues ("createdById");

CREATE INDEX idx_issues_inventory_item ON issues ("inventoryItemId");

CREATE INDEX idx_issues_created_at ON issues ("createdAt");

-- Paso 5: Crear trigger para updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();