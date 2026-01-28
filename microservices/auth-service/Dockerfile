# Auth Service - Dockerfile

FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client using the actual JS executable
RUN node ./node_modules/prisma/build/index.js generate

# Build TypeScript using node directly
RUN node ./node_modules/typescript/lib/tsc.js

# Remove dev dependencies
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S auth-user -u 1001 && \
    chown -R auth-user:nodejs /app

# Switch to non-root user
USER auth-user

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "start"]