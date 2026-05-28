#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "" ]; then
  echo "Usage: scripts/create-lark-design-doc.sh <design-brief.md> [parent-token]" >&2
  exit 1
fi

DOC_PATH="$1"
PARENT_TOKEN="${2:-}"

if [ ! -f "$DOC_PATH" ]; then
  echo "Markdown file not found: $DOC_PATH" >&2
  exit 1
fi

ARGS=(
  docs +create
  --api-version v2
  --doc-format markdown
  --content "@$DOC_PATH"
)

if [ "$PARENT_TOKEN" != "" ]; then
  ARGS+=(--parent-token "$PARENT_TOKEN")
fi

lark-cli "${ARGS[@]}"
