#!/bin/bash
# Detect project type and ports
# Usage: detect-project.sh [project-root]
# Output: key=value pairs for project type, ports, and start commands

ROOT="${1:-.}"

echo "=== Project Type ==="

# Check for Docker
[ -f "$ROOT/docker-compose.yml" ] || [ -f "$ROOT/docker-compose.yaml" ] && echo "HAS_DOCKER=true" || echo "HAS_DOCKER=false"

# Check for start/stop scripts
[ -f "$ROOT/server.sh" ] && echo "HAS_SERVER_SH=true" || echo "HAS_SERVER_SH=false"
[ -f "$ROOT/client.sh" ] && echo "HAS_CLIENT_SH=true" || echo "HAS_CLIENT_SH=false"
[ -f "$ROOT/stop.sh" ] && echo "HAS_STOP_SH=true" || echo "HAS_STOP_SH=false"

# Check for project structure
[ -d "$ROOT/backend" ] || [ -d "$ROOT/server" ] && echo "HAS_BACKEND=true" || echo "HAS_BACKEND=false"
[ -d "$ROOT/frontend" ] || [ -d "$ROOT/client" ] && echo "HAS_FRONTEND=true" || echo "HAS_FRONTEND=false"

# Detect backend directory name
for dir in backend server; do
  [ -d "$ROOT/$dir" ] && echo "BACKEND_DIR=$dir" && break
done

# Detect frontend directory name
for dir in frontend client; do
  [ -d "$ROOT/$dir" ] && echo "FRONTEND_DIR=$dir" && break
done

# Check for Python
[ -f "$ROOT/manage.py" ] && echo "FRAMEWORK=django"
[ -f "$ROOT/app.py" ] && echo "FRAMEWORK=flask"
([ -f "$ROOT/main.py" ] && grep -q "fastapi\|FastAPI" "$ROOT/main.py" 2>/dev/null) && echo "FRAMEWORK=fastapi"

# Check for Go
[ -f "$ROOT/go.mod" ] && echo "FRAMEWORK=go"

# Check for single Node server
[ -f "$ROOT/server.js" ] || [ -f "$ROOT/app.js" ] || [ -f "$ROOT/index.js" ] && echo "SINGLE_SERVER=true"

echo ""
echo "=== Ports ==="

# Scan all .env files for ports
for envfile in "$ROOT"/.env "$ROOT"/backend/.env "$ROOT"/server/.env "$ROOT"/frontend/.env "$ROOT"/client/.env; do
  if [ -f "$envfile" ]; then
    relative=$(echo "$envfile" | sed "s|^$ROOT/||")
    while IFS= read -r line; do
      echo "$relative: $line"
    done < <(grep -iE '^[^#]*(PORT|port)' "$envfile" 2>/dev/null)
  fi
done

# Check docker-compose for ports
if [ -f "$ROOT/docker-compose.yml" ]; then
  echo ""
  echo "=== Docker Ports ==="
  grep -A1 'ports:' "$ROOT/docker-compose.yml" 2>/dev/null | grep -oE '[0-9]+:[0-9]+'
fi
