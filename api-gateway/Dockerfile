# API Gateway
# Punto de entrada único para todos los microservicios
FROM node:20-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm install

# Crear directorio para logs
RUN mkdir -p logs

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S api-gateway -u 1001 && \
    chown -R api-gateway:nodejs /app

# Cambiar a usuario no-root
USER api-gateway

# Exponer puerto
EXPOSE 8000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1

# Comando de inicio
CMD ["npm", "start"]