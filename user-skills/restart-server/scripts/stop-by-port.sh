#!/bin/bash
# Stop processes running on specified ports
# Usage: stop-by-port.sh <port1> [port2] [port3] ...

if [ $# -eq 0 ]; then
  echo "Usage: stop-by-port.sh <port1> [port2] ..."
  exit 1
fi

for PORT in "$@"; do
  PID=$(ss -tlnp 2>/dev/null | grep ":$PORT " | grep -oP 'pid=\K[0-9]+' | head -1)

  if [ -z "$PID" ]; then
    # Try lsof as fallback
    PID=$(lsof -ti ":$PORT" 2>/dev/null | head -1)
  fi

  if [ -n "$PID" ]; then
    PROC=$(ps -p "$PID" -o comm= 2>/dev/null)
    echo "Port $PORT: killing $PROC (PID $PID)..."
    kill "$PID" 2>/dev/null
    sleep 1
    # Force kill if still alive
    if kill -0 "$PID" 2>/dev/null; then
      echo "  Graceful kill failed, force killing..."
      kill -9 "$PID" 2>/dev/null
    fi
    echo "  Done"
  else
    echo "Port $PORT: no process found"
  fi
done
