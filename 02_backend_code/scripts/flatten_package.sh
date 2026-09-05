#!/usr/bin/env bash
# Merge nested 02_backend_code/backend_code/ into 02_backend_code/ (single package root).
# Run from repo root OR from 02_backend_code/.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NESTED="$ROOT/backend_code"

if [[ ! -d "$NESTED/app" ]]; then
  echo "No nested backend_code/app found under $ROOT — nothing to flatten."
  exit 0
fi

echo "Flattening $NESTED → $ROOT"

# Prefer nested (complete) over incomplete top-level shell
if [[ -d "$ROOT/app" ]] && [[ ! -d "$ROOT/app/core" ]]; then
  echo "Removing incomplete top-level app/ (no core/)"
  rm -rf "$ROOT/app"
fi

# Move nested contents up (dotfiles included)
shopt -s dotglob nullglob
for item in "$NESTED"/*; do
  name="$(basename "$item")"
  dest="$ROOT/$name"
  if [[ -e "$dest" ]]; then
    echo "  merge/overwrite: $name"
    if [[ -d "$item" && -d "$dest" ]]; then
      cp -a "$item"/. "$dest"/
      rm -rf "$item"
    else
      rm -rf "$dest"
      mv "$item" "$dest"
    fi
  else
    echo "  move: $name"
    mv "$item" "$dest"
  fi
done

rmdir "$NESTED" 2>/dev/null || rm -rf "$NESTED"
echo "Done. Package root is: $ROOT"
echo "Verify: ls $ROOT/app/modules"
