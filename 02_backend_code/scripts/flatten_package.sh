#!/usr/bin/env bash
# Flatten nested 02_backend_code/backend_code/ into 02_backend_code/
# Portable: no pipefail (Windows Git Bash safe)
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NESTED="$ROOT/backend_code"

echo "Package root: $ROOT"

if [ ! -d "$NESTED/app" ]; then
  echo "No nested backend_code/app - checking layout..."
  if [ -d "$ROOT/app/core" ] && [ -d "$ROOT/app/modules" ]; then
    echo "Already flat (app/core + app/modules present). Done."
    exit 0
  fi
  echo "ERROR: incomplete tree."
  exit 1
fi

echo "Found nested complete tree at $NESTED"

if [ -d "$ROOT/app" ] && [ ! -d "$ROOT/app/core" ]; then
  echo "Removing incomplete top-level app/"
  rm -rf "$ROOT/app"
fi

for item in "$NESTED"/* "$NESTED"/.[!.]* "$NESTED"/..?*; do
  [ -e "$item" ] || continue
  name="$(basename "$item")"
  dest="$ROOT/$name"
  if [ -e "$dest" ]; then
    echo "  replace: $name"
    rm -rf "$dest"
  else
    echo "  move: $name"
  fi
  mv "$item" "$dest"
done

rm -rf "$NESTED"
echo ""
echo "Flattened. Verify:"
ls "$ROOT/app/modules" 2>/dev/null | head
[ -f "$ROOT/app/main.py" ] && echo "OK app/main.py"
[ -d "$ROOT/app/core" ] && echo "OK app/core"
[ -d "$ROOT/app/modules/rbac" ] && echo "OK app/modules/rbac"
