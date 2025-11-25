/*
  Warnings:

  - You are about to drop the column `sala` on the `mensajes_chat` table. All the data in the column will be lost.
  - Added the required column `tabla` to the `auditoria_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `denunciaId` to the `mensajes_chat` table without a default value. This is not possible if the table is not empty.

*/

-- Primero, agregar la columna 'tabla' con un valor por defecto temporal para registros existentes
ALTER TABLE "auditoria_logs" ADD COLUMN "tabla" TEXT;
UPDATE "auditoria_logs" SET "tabla" = 'Sistema' WHERE "tabla" IS NULL;
ALTER TABLE "auditoria_logs" ALTER COLUMN "tabla" SET NOT NULL;

-- Agregar columna registroId
ALTER TABLE "auditoria_logs" ADD COLUMN "registroId" TEXT;

-- Para mensajes_chat, asignar a la primera denuncia disponible si existe alguna
-- Si no hay denuncias, eliminar los mensajes huérfanos
DO $$
DECLARE
    primera_denuncia TEXT;
BEGIN
    -- Obtener el ID de la primera denuncia disponible
    SELECT id INTO primera_denuncia FROM denuncias LIMIT 1;
    
    -- Si existe al menos una denuncia, asignar mensajes a ella
    IF primera_denuncia IS NOT NULL THEN
        ALTER TABLE "mensajes_chat" ADD COLUMN "denunciaId" TEXT;
        UPDATE "mensajes_chat" SET "denunciaId" = primera_denuncia WHERE "denunciaId" IS NULL;
        ALTER TABLE "mensajes_chat" ALTER COLUMN "denunciaId" SET NOT NULL;
    ELSE
        -- Si no hay denuncias, limpiar mensajes huérfanos y agregar columna
        DELETE FROM "mensajes_chat";
        ALTER TABLE "mensajes_chat" ADD COLUMN "denunciaId" TEXT NOT NULL DEFAULT '';
        ALTER TABLE "mensajes_chat" ALTER COLUMN "denunciaId" DROP DEFAULT;
    END IF;
END $$;

-- Eliminar columna sala y agregar esAnonimo
ALTER TABLE "mensajes_chat" DROP COLUMN "sala";
ALTER TABLE "mensajes_chat" ADD COLUMN "esAnonimo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "reglas_supervisor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categorias" "CategoriaDenuncia"[],
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_supervisor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reglas_supervisor_activa_idx" ON "reglas_supervisor"("activa");

-- CreateIndex
CREATE INDEX "reglas_supervisor_prioridad_idx" ON "reglas_supervisor"("prioridad");

-- CreateIndex
CREATE INDEX "auditoria_logs_tabla_idx" ON "auditoria_logs"("tabla");

-- CreateIndex
CREATE INDEX "mensajes_chat_denunciaId_idx" ON "mensajes_chat"("denunciaId");
