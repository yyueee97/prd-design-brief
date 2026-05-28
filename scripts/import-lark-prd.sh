#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: scripts/import-lark-prd.sh <lark-doc-url-or-token> [output.md]" >&2
  exit 1
fi

DOC="$1"
OUT="${2:-lark-prd.md}"

lark-cli docs +fetch --api-version v2 --doc "$DOC" --doc-format markdown > "$OUT"
echo "Saved PRD markdown to $OUT"
