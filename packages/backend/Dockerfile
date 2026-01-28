# Stage 1: Build
FROM node:18-alpine AS builder

# Install pnpm (lockfile version 6.0 requires pnpm 8.x)
RUN npm install -g pnpm@10.28.2

WORKDIR /monorepo

# Copy monorepo root package files
COPY pnpm-workspace.yaml pnpm-lock.yaml* package.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy backend package
COPY packages/backend ./packages/backend

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Build backend (tsup bundles shared package inline)
WORKDIR /monorepo/packages/backend
RUN pnpm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Create minimal package.json to mark as ESM
RUN echo '{"type":"module","name":"skill-issue-backend","version":"0.1.0"}' > package.json

# Copy built bundle (includes all code from shared package)
COPY --from=builder /monorepo/packages/backend/dist ./dist

# Copy static files (admin dashboard)
COPY --from=builder /monorepo/packages/backend/public ./public

# Copy other necessary files
COPY --from=builder /monorepo/packages/backend/supabase-schema.sql ./
COPY --from=builder /monorepo/packages/backend/example-skills.sql ./

# Install only runtime dependencies (those marked as external in tsup.config.ts)
# The shared package code is already bundled in dist/index.js
RUN npm install --omit=dev \
  express@^4.18.2 \
  dotenv@^16.3.1 \
  @supabase/supabase-js@^2.39.0 \
  @anthropic-ai/sdk@^0.30.1 \
  node-cron@^3.0.3 \
  expo-server-sdk@^3.7.0 \
  zod@^3.22.4

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
