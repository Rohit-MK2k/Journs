# ==========================================
# Stage 1: Build NestJS TypeScript
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root dependency manifests
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci

# Copy backend source code
COPY src ./src

# Compile TypeScript to dist/
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
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled distribution from builder stage
COPY --from=builder /app/dist ./dist

# Switch to unprivileged user
USER nestjs

# Cloud Run defaults to port 8080
EXPOSE 8080

CMD ["node", "dist/main.js"]
