#!/bin/bash
# Check if specified ports are listening
# Usage: check-ports.sh <port1> [port2] ...

if [ $# -eq 0 ]; then
  echo "Usage: check-ports.sh <port1> [port2] ..."
  exit 1
fi

ALL_OK=true

for PORT in "$@"; do
  if ss -tlnp 2>/dev/null | grep -q ":$PORT "; then
    echo "Port $PORT: ✓ LISTENING"
  elif lsof -i ":$PORT" >/dev/null 2>&1; then
    echo "Port $PORT: ✓ LISTENING"
  else
    echo "Port $PORT: ✗ NOT LISTENING"
    ALL_OK=false
  fi
done

if [ "$ALL_OK" = true ]; then
  exit 0
else
  exit 1
fi
