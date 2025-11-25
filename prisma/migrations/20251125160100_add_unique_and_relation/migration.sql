-- Limpiar datos duplicados antes de crear el constraint
DELETE FROM "reglas_supervisor";

-- AddForeignKey
ALTER TABLE "reglas_supervisor" ADD CONSTRAINT "reglas_supervisor_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "reglas_supervisor_prioridad_idx" ON "reglas_supervisor"("prioridad");

-- CreateIndex
CREATE UNIQUE INDEX "reglas_supervisor_categoria_prioridad_activa_key" ON "reglas_supervisor"("categoria", "prioridad", "activa");
