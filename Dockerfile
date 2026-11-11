# ==========================================
# Stage 1: Build NestJS TypeScript Monorepo
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root dependency manifests and base config
COPY package*.json tsconfig.base.json tsconfig.json ./

# Copy packages and apps/backend manifests and source
COPY packages ./packages
COPY apps/backend ./apps/backend

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci

# Compile workspace packages and apps/backend
RUN npm run build

# ==========================================
# Stage 2: Production Container Runner
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Create unprivileged application user for security hardening
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy dependency manifests and install production-only dependencies
COPY package*.json ./
COPY packages ./packages
COPY apps/backend/package.json ./apps/backend/package.json
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled distributions from builder stage
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist

# Switch to unprivileged user
USER nestjs

# Cloud Run defaults to port 8080
EXPOSE 8080

CMD ["node", "apps/backend/dist/main.js"]
