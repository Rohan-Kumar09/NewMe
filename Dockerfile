# Build image
FROM node:20-alpine AS deps
WORKDIR /app

# Copy ONLY frontend package files
COPY app/package*.json ./
RUN npm install

# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY app ./app

WORKDIR /app/app
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app/app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/app ./

EXPOSE 8080

CMD ["npm", "run", "start"]
