# Use Node.js LTS version
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies needed for building and health checks
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy all source files
COPY . .

# Build Next.js application
RUN npm run build

# Build Express server
RUN npm run build:server

# Expose port (App Engine will set PORT env var)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV EXPRESS_PORT=3001
ENV EXPRESS_API_URL=http://localhost:3001

# Copy start script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/api/config || exit 1

# Start the application
CMD ["/app/start.sh"]

