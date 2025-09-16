# Build stage
FROM node:18 AS builder

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
FROM node:18 AS production

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace package files for production install
COPY package*.json ./
COPY package-lock.json ./
COPY ./backend/package*.json ./backend/

# Install production dependencies (ensures proper workspace structure)
RUN npm ci --workspace=backend --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/backend/dist ./backend/dist

# Set working directory to backend for running the app
WORKDIR /app/backend

# Create non-root user
RUN groupadd -g 1001 nodejs
RUN useradd -r -u 1001 -g nodejs nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the application
CMD ["npm", "start"]