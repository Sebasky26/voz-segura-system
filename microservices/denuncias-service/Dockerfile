# Denuncias Service - Dockerfile

FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create directories
RUN mkdir -p logs uploads/evidencias

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S denuncias-user -u 1001 && \
    chown -R denuncias-user:nodejs /app

# Switch to non-root user
USER denuncias-user

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Expose port
EXPOSE 3002

# Start command
CMD ["npm", "start"]