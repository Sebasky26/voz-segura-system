-- Limpiar datos duplicados antes de crear el constraint
DELETE FROM "reglas_supervisor";

-- AddForeignKey (solo si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reglas_supervisor_supervisorId_fkey'
    ) THEN
        ALTER TABLE "reglas_supervisor" ADD CONSTRAINT "reglas_supervisor_supervisorId_fkey" 
        FOREIGN KEY ("supervisorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex (solo si no existe)
CREATE INDEX IF NOT EXISTS "reglas_supervisor_prioridad_idx" ON "reglas_supervisor"("prioridad");

-- CreateIndex (solo si no existe - ya se creó en la migración anterior)
CREATE UNIQUE INDEX IF NOT EXISTS "reglas_supervisor_categoria_prioridad_activa_key" ON "reglas_supervisor"("categoria", "prioridad", "activa");
