-- Agregar campos de aprobación a la tabla dashboards
ALTER TABLE public.dashboards
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (
    status IN (
        'pending',
        'approved',
        'rejected'
    )
),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Actualizar dashboards existentes creados por admins para que estén approved automáticamente
UPDATE public.dashboards
SET
    status = 'approved',
    approved_at = now()
WHERE
    owner_id IN (
        SELECT id
        FROM public.users
        WHERE
            role IN ('admin', 'superadmin')
    )
    AND status = 'pending';

-- Políticas RLS para dashboards con aprobación
-- Los usuarios pueden crear dashboards (status = 'pending')
-- Los usuarios pueden ver sus propios dashboards
-- Los admins pueden ver todos los dashboards y aprobar/rechazar
-- Solo dashboards approved son visibles para usuarios normales (además de los propios)