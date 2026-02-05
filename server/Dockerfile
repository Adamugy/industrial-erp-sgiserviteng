# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy root dependency files
COPY package*.json ./
# Copy server dependency files
COPY server/package*.json ./server/
# Copy connectors
COPY connectors ./connectors

# Install everything in builder
RUN npm install
RUN cd server && npm install

# Generate Prisma
COPY server/prisma ./server/prisma
RUN cd server && npx prisma generate

# Copy source and build
COPY server/src ./server/src
COPY server/tsconfig.json ./server/
RUN cd server && npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy built files and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/connectors ./connectors
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/dist ./server/dist

# Expose port
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080

# Run from server/dist
WORKDIR /app/server
CMD ["node", "dist/index.js"]
