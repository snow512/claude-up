#!/bin/bash
# Detect ports used in .env files across the project
# Usage: detect-ports.sh [project-root]
# Output: JSON-like format of port variables found

ROOT="${1:-.}"

find "$ROOT" -name ".env" -not -path "*/node_modules/*" -not -path "*/.git/*" | while read envfile; do
  dir=$(dirname "$envfile" | sed "s|^$ROOT/||;s|^$ROOT$|.|")
  echo "=== $dir/.env ==="
  grep -iE '(PORT|port)' "$envfile" 2>/dev/null | grep -v '^#'
done
