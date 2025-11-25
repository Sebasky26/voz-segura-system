/*
  Warnings:

  - You are about to drop the column `categorias` on the `reglas_supervisor` table. All the data in the column will be lost.
  - Added the required column `categoria` to the `reglas_supervisor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supervisorId` to the `reglas_supervisor` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "reglas_supervisor_prioridad_idx";

-- AlterTable
ALTER TABLE "reglas_supervisor" DROP COLUMN "categorias",
ADD COLUMN     "categoria" "CategoriaDenuncia" NOT NULL,
ADD COLUMN     "supervisorId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "reglas_supervisor_categoria_idx" ON "reglas_supervisor"("categoria");

-- CreateIndex
CREATE INDEX "reglas_supervisor_supervisorId_idx" ON "reglas_supervisor"("supervisorId");
