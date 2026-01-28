-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "recurso" TEXT,
    "detalles" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "exitoso" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tabla" TEXT NOT NULL,
    "registroId" TEXT,
    "servicio" TEXT,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descripcion" TEXT,
    "servicio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metricas_negocio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "unidad" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "servicio" TEXT NOT NULL,
    "categoria" TEXT,

    CONSTRAINT "metricas_negocio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_logs_usuarioId_idx" ON "auditoria_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "auditoria_logs_accion_idx" ON "auditoria_logs"("accion");

-- CreateIndex
CREATE INDEX "auditoria_logs_tabla_idx" ON "auditoria_logs"("tabla");

-- CreateIndex
CREATE INDEX "auditoria_logs_createdAt_idx" ON "auditoria_logs"("createdAt");

-- CreateIndex
CREATE INDEX "auditoria_logs_servicio_idx" ON "auditoria_logs"("servicio");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_clave_key" ON "configuraciones"("clave");

-- CreateIndex
CREATE INDEX "configuraciones_clave_idx" ON "configuraciones"("clave");

-- CreateIndex
CREATE INDEX "configuraciones_servicio_idx" ON "configuraciones"("servicio");

-- CreateIndex
CREATE INDEX "metricas_negocio_nombre_idx" ON "metricas_negocio"("nombre");

-- CreateIndex
CREATE INDEX "metricas_negocio_fecha_idx" ON "metricas_negocio"("fecha");

-- CreateIndex
CREATE INDEX "metricas_negocio_servicio_idx" ON "metricas_negocio"("servicio");
