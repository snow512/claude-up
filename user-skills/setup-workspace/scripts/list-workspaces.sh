#!/bin/bash
# List all workspaces (sibling directories with same git remote)
# Usage: list-workspaces.sh [project-root]

ROOT="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
REMOTE=$(git -C "$ROOT" remote get-url origin 2>/dev/null)
PARENT=$(dirname "$ROOT")

if [ -z "$REMOTE" ]; then
  echo "ERROR: Not a git repository or no remote configured"
  exit 1
fi

echo "Remote: $REMOTE"
echo "---"

for dir in "$PARENT"/*/; do
  [ ! -d "$dir/.git" ] && continue
  dir_remote=$(git -C "$dir" remote get-url origin 2>/dev/null)
  [ "$dir_remote" != "$REMOTE" ] && continue

  branch=$(git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null)
  status=$(git -C "$dir" status --porcelain 2>/dev/null | wc -l)
  name=$(basename "$dir")

  # Detect ports
  ports=""
  for envfile in "$dir"/.env "$dir"/backend/.env "$dir"/server/.env "$dir"/frontend/.env "$dir"/client/.env; do
    [ -f "$envfile" ] && ports="$ports $(grep -ioE '(PORT|port)[= ]+[0-9]+' "$envfile" 2>/dev/null | grep -oE '[0-9]+' | tr '\n' ',')"
  done
  ports=$(echo "$ports" | sed 's/,$//' | xargs)

  if [ "$dir" = "$ROOT/" ]; then
    marker=" (current)"
  else
    marker=""
  fi

  echo "$name$marker | branch: $branch | uncommitted: $status | ports: ${ports:-N/A}"
done
