-- Primero eliminar todas las reglas existentes para evitar conflictos
DELETE FROM "reglas_supervisor";

-- Eliminar el índice del estado
DROP INDEX IF EXISTS "reglas_supervisor_estado_idx";

-- Eliminar la constraint única anterior
ALTER TABLE "reglas_supervisor" DROP CONSTRAINT IF EXISTS "reglas_supervisor_categoria_estado_activa_key";

-- Eliminar la columna estado
ALTER TABLE "reglas_supervisor" DROP COLUMN "estado";

-- Crear la nueva constraint única con prioridad
CREATE UNIQUE INDEX "reglas_supervisor_categoria_prioridad_activa_key" ON "reglas_supervisor"("categoria", "prioridad", "activa");
