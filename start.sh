#!/bin/sh
set -e

echo "Starting application..."

# Set default port if not provided by App Engine
export PORT=${PORT:-8080}
export EXPRESS_PORT=${EXPRESS_PORT:-3001}
export EXPRESS_API_URL=${EXPRESS_API_URL:-http://localhost:3001}
export NODE_ENV=${NODE_ENV:-production}

echo "Environment:"
echo "  PORT=$PORT"
echo "  EXPRESS_PORT=$EXPRESS_PORT"
echo "  EXPRESS_API_URL=$EXPRESS_API_URL"
echo "  NODE_ENV=$NODE_ENV"

# Start Express server in background
echo "Starting Express server on port $EXPRESS_PORT..."
node dist/server/index.js &
EXPRESS_PID=$!

# Wait for Express to be ready
echo "Waiting for Express server to start..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -f http://localhost:$EXPRESS_PORT/health > /dev/null 2>&1; then
    echo "✓ Express server is ready"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "✗ Express server failed to start"
    exit 1
  fi
  echo "  Waiting... ($i/10)"
  sleep 1
done

# Start Next.js on the port provided by App Engine
echo "Starting Next.js on port $PORT..."
PORT=$PORT npm start &
NEXT_PID=$!

# Wait for Next.js to be ready
echo "Waiting for Next.js to start..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -f http://localhost:$PORT/api/config > /dev/null 2>&1; then
    echo "✓ Next.js is ready"
    break
  fi
  if [ $i -eq 10 ]; then
    echo "✗ Next.js failed to start"
    exit 1
  fi
  echo "  Waiting... ($i/10)"
  sleep 2
done

echo "✓ Application is ready!"

# Function to handle shutdown
cleanup() {
  echo "Shutting down..."
  kill $EXPRESS_PID $NEXT_PID 2>/dev/null || true
  wait
  exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for both processes
wait

