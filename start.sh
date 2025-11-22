#!/bin/sh

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
node server/dist/index.js &
EXPRESS_PID=$!

# Wait for Express to be ready
echo "Waiting for Express server to start..."
EXPRESS_READY=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -f http://localhost:$EXPRESS_PORT/health > /dev/null 2>&1; then
    echo "✓ Express server is ready"
    EXPRESS_READY=1
    break
  fi
  echo "  Waiting... ($i/10)"
  sleep 1
done

if [ $EXPRESS_READY -eq 0 ]; then
  echo "✗ Express server failed to start"
  kill $EXPRESS_PID 2>/dev/null || true
  exit 1
fi

# Start Next.js on the port provided by App Engine
# Next.js needs to listen on 0.0.0.0 (all interfaces) for Cloud Run/App Engine
# The -H 0.0.0.0 flag is set in package.json start script
echo "Starting Next.js on port $PORT..."
PORT=$PORT npm start &
NEXT_PID=$!

# Wait for Next.js to be ready (allow more time for first startup)
echo "Waiting for Next.js to start..."
NEXT_READY=0
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  if curl -f http://localhost:$PORT/api/config > /dev/null 2>&1; then
    echo "✓ Next.js is ready"
    NEXT_READY=1
    break
  fi
  echo "  Waiting... ($i/20)"
  sleep 2
done

if [ $NEXT_READY -eq 0 ]; then
  echo "✗ Next.js failed to start"
  kill $EXPRESS_PID $NEXT_PID 2>/dev/null || true
  exit 1
fi

echo "✓ Application is ready and listening on port $PORT"

# Keep the script running and monitor both processes
# This ensures the container stays alive
# Use a simple loop instead of trap for better sh compatibility
while true; do
  # Check if processes are still running
  if ! kill -0 $EXPRESS_PID 2>/dev/null; then
    echo "Express server process died"
    kill $NEXT_PID 2>/dev/null || true
    exit 1
  fi
  if ! kill -0 $NEXT_PID 2>/dev/null; then
    echo "Next.js process died"
    kill $EXPRESS_PID 2>/dev/null || true
    exit 1
  fi
  sleep 5
done

