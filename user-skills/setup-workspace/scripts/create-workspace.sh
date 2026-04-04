#!/bin/bash
# Create a new workspace by cloning the same project
# Usage: create-workspace.sh <workspace-name> [branch-name] [port-offset]
#
# port-offset: multiplied by 10 and added to base ports (default: auto-detect next available)

set -e

WORKSPACE_NAME="$1"
BRANCH_NAME="$2"
PORT_OFFSET="$3"

if [ -z "$WORKSPACE_NAME" ]; then
  echo "Usage: create-workspace.sh <workspace-name> [branch-name] [port-offset]"
  exit 1
fi

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
REMOTE=$(git remote get-url origin 2>/dev/null)
PARENT=$(dirname "$ROOT")
TARGET="$PARENT/$WORKSPACE_NAME"

if [ -z "$REMOTE" ]; then
  echo "ERROR: No git remote found"
  exit 1
fi

if [ -d "$TARGET" ]; then
  echo "ERROR: Directory already exists: $TARGET"
  exit 1
fi

# Auto-detect port offset if not specified
if [ -z "$PORT_OFFSET" ]; then
  existing=0
  for dir in "$PARENT"/*/; do
    [ ! -d "$dir/.git" ] && continue
    dir_remote=$(git -C "$dir" remote get-url origin 2>/dev/null)
    [ "$dir_remote" = "$REMOTE" ] && existing=$((existing + 1))
  done
  PORT_OFFSET=$existing
fi

echo "=== Creating workspace ==="
echo "Source: $ROOT"
echo "Target: $TARGET"
echo "Port offset: $PORT_OFFSET (ports += $((PORT_OFFSET * 10)))"
echo ""

# Clone
echo "[1/4] Cloning..."
git clone "$REMOTE" "$TARGET"

# Checkout branch
if [ -n "$BRANCH_NAME" ]; then
  echo "[2/4] Checking out branch: $BRANCH_NAME"
  cd "$TARGET"
  git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
else
  echo "[2/4] Using default branch"
  cd "$TARGET"
fi

# Copy .env files from source and adjust ports
echo "[3/4] Setting up .env files..."
find "$ROOT" -name ".env" -not -path "*/node_modules/*" -not -path "*/.git/*" | while read src_env; do
  relative=$(echo "$src_env" | sed "s|^$ROOT/||")
  dest_env="$TARGET/$relative"
  dest_dir=$(dirname "$dest_env")
  mkdir -p "$dest_dir"

  if [ -f "$dest_env" ]; then
    continue  # Don't overwrite if already exists
  fi

  # Copy and adjust port numbers
  OFFSET=$((PORT_OFFSET * 10))
  sed -E "s/(PORT[= ]+)([0-9]+)/echo \"\1\$((\2 + $OFFSET))\"/ge" "$src_env" > "$dest_env" 2>/dev/null || cp "$src_env" "$dest_env"

  echo "  Copied: $relative (ports +$OFFSET)"
done

# Docker container/volume/network names — append workspace suffix
for envfile in "$TARGET"/.env "$TARGET"/docker-compose.yml; do
  if [ -f "$envfile" ]; then
    # Add workspace suffix to container names to avoid conflicts
    ws_suffix=$(echo "$WORKSPACE_NAME" | sed 's/.*-//')
    sed -i "s/container_name: \(.*\)/container_name: \1-$ws_suffix/g" "$envfile" 2>/dev/null || true
  fi
done

# Install dependencies
echo "[4/4] Installing dependencies..."
if [ -f "$TARGET/package.json" ]; then
  cd "$TARGET" && npm install 2>/dev/null && echo "  Root: npm install done"
fi
for subdir in backend server frontend client; do
  if [ -f "$TARGET/$subdir/package.json" ]; then
    cd "$TARGET/$subdir" && npm install 2>/dev/null && echo "  $subdir: npm install done"
  fi
done
if [ -f "$TARGET/requirements.txt" ]; then
  cd "$TARGET" && pip install -r requirements.txt 2>/dev/null && echo "  Python: pip install done"
fi
if [ -f "$TARGET/pyproject.toml" ]; then
  cd "$TARGET" && pip install -e . 2>/dev/null || poetry install 2>/dev/null && echo "  Python: project install done"
fi

echo ""
echo "=== Workspace created ==="
echo "Path: $TARGET"
echo "Port offset: +$((PORT_OFFSET * 10))"
echo ""
echo "Next steps:"
echo "  cd $TARGET"
echo "  # Start Docker if needed: docker compose up -d"
echo "  # Start server: use restart-server skill"
