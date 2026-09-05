#!/usr/bin/env bash
# Flatten nested 02_backend_code/backend_code/ into 02_backend_code/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NESTED="$ROOT/backend_code"

echo "Package root: $ROOT"

if [[ ! -d "$NESTED/app" ]]; then
  echo "No nested backend_code/app — checking layout..."
  if [[ -d "$ROOT/app/core" && -d "$ROOT/app/modules" ]]; then
    echo "Already flat (app/core + app/modules present). Done."
    exit 0
  fi
  echo "ERROR: incomplete tree. Restore from backend_code.tar.gz"
  exit 1
fi

echo "Found nested complete tree at $NESTED"

# Remove incomplete top-level app if it lacks core/
if [[ -d "$ROOT/app" ]] && [[ ! -d "$ROOT/app/core" ]]; then
  echo "Removing incomplete top-level app/"
  rm -rf "$ROOT/app"
fi

# Prefer nested for every path
shopt -s dotglob nullglob
for item in "$NESTED"/*; do
  name="$(basename "$item")"
  dest="$ROOT/$name"
  if [[ -e "$dest" ]]; then
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
ls -la "$ROOT/app/modules" | head
test -f "$ROOT/app/main.py" && echo "OK app/main.py"
test -d "$ROOT/app/core" && echo "OK app/core"
test -d "$ROOT/app/modules/rbac" && echo "OK app/modules/rbac"
