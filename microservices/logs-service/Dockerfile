# Logs Service
# Este servicio maneja auditoría, métricas y configuraciones del sistema
FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma/ ./prisma/

# Instalar dependencias
RUN npm install

# Crear directorio para logs
RUN mkdir -p logs

# Copiar código fuente
COPY src/ ./src/

# Generar cliente Prisma
RUN npm run prisma:generate

# Compilar TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S logs-service -u 1001 && \
    chown -R logs-service:nodejs /app

# Cambiar a usuario no-root
USER logs-service

# Exponer puerto
EXPOSE 3003

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

# Comando de inicio
CMD ["npm", "start"]