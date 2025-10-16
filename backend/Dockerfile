# Build stage
FROM node:22 AS builder

WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY package-lock.json ./

# Copy backend package.json
COPY ./backend/package*.json ./backend/

# Install all dependencies (including dev deps for building)
RUN npm ci --workspace=backend

# Copy source code
COPY ./backend ./backend

# Set working directory to backend for build
WORKDIR /app/backend

# Build the application
RUN npm run build

# Production stage
FROM node:22-slim AS production

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY package-lock.json ./
COPY ./backend/package*.json ./backend/

# Install production dependencies (native addons will use prebuilt binaries or compile with existing tools)
RUN npm ci --workspace=backend --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/backend/dist ./backend/dist

# Set working directory to backend for running the app
WORKDIR /app/backend

# Use the existing node user from the base image
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["npm", "start"]