FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy the entire workspace
COPY . .

# Install dependencies and build all required packages
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter=@freeloader/gateway...

# Deploy the gateway package (extracts only what is needed for production)
RUN pnpm --filter=@freeloader/gateway deploy /prod/gateway --prod

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

# Copy the pruned deploy folder
COPY --from=builder --chown=nodejs:nodejs /prod/gateway .

EXPOSE 3000

# Start the Fastify server
CMD ["node", "dist/server.js"]
