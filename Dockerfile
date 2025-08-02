# Multi-stage Dockerfile for CTRL MVP
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/package*.json ./packages/backend/

# Install dependencies
RUN npm ci --only=production

# Development dependencies for build
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/backend/package*.json ./packages/backend/
RUN npm ci

# Copy source code
COPY . .

# Build frontend
FROM base AS frontend-build
WORKDIR /app/packages/frontend
RUN npm run build

# Build backend
FROM base AS backend-build
WORKDIR /app/packages/backend
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy built backend
COPY --from=backend-build --chown=nextjs:nodejs /app/packages/backend/dist ./backend/dist
COPY --from=backend-build --chown=nextjs:nodejs /app/packages/backend/package*.json ./backend/

# Copy built frontend
COPY --from=frontend-build --chown=nextjs:nodejs /app/packages/frontend/dist ./frontend/dist

# Copy shared package
COPY --from=base --chown=nextjs:nodejs /app/packages/shared ./shared

# Install only production dependencies for backend
WORKDIR /app/backend
RUN npm ci --only=production

# Create a simple server to serve both frontend and backend
WORKDIR /app
COPY --chown=nextjs:nodejs docker/server.js ./server.js

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"] 