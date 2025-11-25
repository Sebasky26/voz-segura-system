-- AlterTable
ALTER TABLE "mensajes_chat" ADD COLUMN     "destinatarioId" TEXT;

-- CreateIndex
CREATE INDEX "mensajes_chat_destinatarioId_idx" ON "mensajes_chat"("destinatarioId");
