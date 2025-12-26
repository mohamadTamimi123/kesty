# Multi-stage build for NestJS Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY api/project-name/package.json api/project-name/pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY api/project-name/ ./

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install PM2 globally
RUN npm install -g pm2

# Copy package files
COPY api/project-name/package.json api/project-name/pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Copy PM2 ecosystem file
COPY kisty/backend/ecosystem.config.js ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start with PM2 (cwd will be /app from WORKDIR)
CMD ["sh", "-c", "cd /app && pm2-runtime start ecosystem.config.js --no-daemon"]

