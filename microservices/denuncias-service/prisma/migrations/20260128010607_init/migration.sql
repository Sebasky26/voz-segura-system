-- CreateEnum
CREATE TYPE "CategoriaDenuncia" AS ENUM ('ACOSO_LABORAL', 'DISCRIMINACION', 'FALTA_DE_PAGO', 'ACOSO_SEXUAL', 'VIOLACION_DERECHOS', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoDenuncia" AS ENUM ('PENDIENTE', 'EN_REVISION', 'APROBADA', 'DERIVADA', 'CERRADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateTable
CREATE TABLE "denuncias" (
    "id" TEXT NOT NULL,
    "codigoAnonimo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" "CategoriaDenuncia" NOT NULL,
    "estado" "EstadoDenuncia" NOT NULL DEFAULT 'PENDIENTE',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "denuncianteId" TEXT,
    "supervisorId" TEXT,
    "ubicacionGeneral" TEXT,
    "derivadaA" TEXT,
    "fechaDerivacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidencias" (
    "id" TEXT NOT NULL,
    "denunciaId" TEXT NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "nombreCifrado" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "rutaCifrada" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_denuncias" (
    "id" TEXT NOT NULL,
    "denunciaId" TEXT NOT NULL,
    "estadoAnterior" "EstadoDenuncia" NOT NULL,
    "estadoNuevo" "EstadoDenuncia" NOT NULL,
    "comentario" TEXT,
    "realizadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas_supervisor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "categoria" "CategoriaDenuncia" NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_supervisor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "denuncias_codigoAnonimo_key" ON "denuncias"("codigoAnonimo");

-- CreateIndex
CREATE INDEX "reglas_supervisor_activa_idx" ON "reglas_supervisor"("activa");

-- CreateIndex
CREATE INDEX "reglas_supervisor_categoria_idx" ON "reglas_supervisor"("categoria");

-- CreateIndex
CREATE INDEX "reglas_supervisor_prioridad_idx" ON "reglas_supervisor"("prioridad");

-- CreateIndex
CREATE INDEX "reglas_supervisor_supervisorId_idx" ON "reglas_supervisor"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "reglas_supervisor_categoria_prioridad_activa_key" ON "reglas_supervisor"("categoria", "prioridad", "activa");

-- AddForeignKey
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "denuncias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_denuncias" ADD CONSTRAINT "historial_denuncias_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "denuncias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
