-- CreateIndex
CREATE INDEX "mensajes_chat_usuarioId_idx" ON "mensajes_chat"("usuarioId");

-- AddForeignKey
ALTER TABLE "mensajes_chat" ADD CONSTRAINT "mensajes_chat_denunciaId_fkey" FOREIGN KEY ("denunciaId") REFERENCES "denuncias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
