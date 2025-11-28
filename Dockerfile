# Root Dockerfile - Next.js app (Cloud Run: newme-app)

FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Uses your script: "build": "next build"
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy built app and runtime files
COPY --from=builder /app ./

EXPOSE 8080

# Uses your script: "start": "next start -H 0.0.0.0"
CMD ["npm", "run", "start"]
