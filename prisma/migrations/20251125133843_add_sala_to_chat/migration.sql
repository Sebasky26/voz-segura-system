-- AlterTable
ALTER TABLE "mensajes_chat" ADD COLUMN     "sala" TEXT,
ALTER COLUMN "denunciaId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "mensajes_chat_sala_idx" ON "mensajes_chat"("sala");
