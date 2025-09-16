# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY package-lock.json ./

# Copy frontend package.json
COPY ./frontend/package*.json ./frontend/

# Install workspace dependencies
RUN npm ci --workspace=frontend

# Copy source code
COPY ./frontend ./frontend

# Set working directory to frontend
WORKDIR /app/frontend

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy nginx configuration if you have one
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]