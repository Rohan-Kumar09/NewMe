# server/Dockerfile - TS backend (Cloud Run: newme-server)

# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (full, including devDeps for tsc)
COPY package*.json ./
RUN npm install

# Copy entire repo so server can access any shared code
COPY . .

# Uses your script: "build:server": "tsc --project server/tsconfig.json"
RUN npm run build:server

# ---------- Runtime stage ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Only runtime deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled backend
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 8080

# Uses your script: "start:server": "node server/dist/index.js"
CMD ["npm", "run", "start:server"]
