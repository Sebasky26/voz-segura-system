-- Primero eliminar todas las reglas existentes para evitar conflictos
DELETE FROM "reglas_supervisor";

-- Eliminar el índice del estado (si existe)
DROP INDEX IF EXISTS "reglas_supervisor_estado_idx";

-- Eliminar la constraint única anterior (si existe)
ALTER TABLE "reglas_supervisor" DROP CONSTRAINT IF EXISTS "reglas_supervisor_categoria_estado_activa_key";

-- Eliminar la columna estado solo si existe
DO $$ 
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name='reglas_supervisor' AND column_name='estado') THEN
        ALTER TABLE "reglas_supervisor" DROP COLUMN "estado";
    END IF;
END $$;

-- Crear la nueva constraint única con prioridad (si no existe)
CREATE UNIQUE INDEX IF NOT EXISTS "reglas_supervisor_categoria_prioridad_activa_key" ON "reglas_supervisor"("categoria", "prioridad", "activa");
