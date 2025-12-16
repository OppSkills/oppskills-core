# =============================================================================
# Stage 1: Builder - Install dependencies and build all packages
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies and global tools
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    python3 \
    make \
    g++ \
    && npm install -g pnpm@10.5.2 turbo tsx

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages ./packages

# Generate Prisma Client (must happen before build)
RUN cd packages/database && pnpm exec prisma generate

# Build packages in dependency order: db → types → backend
RUN pnpm build --filter=@oppskills/db
RUN pnpm build --filter=@oppskills/types
RUN pnpm build --filter=@oppskills/backend

# =============================================================================
# Stage 2: Production Runtime - Copy only necessary artifacts
# =============================================================================
FROM node:22-alpine AS production

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache \
    openssl \
    curl \
    && npm install -g pnpm@10.5.2 tsx

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/

# Copy Prisma schema before install (needed for postinstall script)
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

# Install production dependencies (allow scripts for Prisma client generation)
RUN pnpm install --prod --frozen-lockfile --config.ignore-scripts=false

# Copy built artifacts from builder stage
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist

# Copy load-secrets script (required for production startup)
COPY load-secrets.mts ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

# Health check for ECS
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start the application (calls load-secrets.mts then starts backend)
CMD ["sh", "-c", "pnpm start:backend"]