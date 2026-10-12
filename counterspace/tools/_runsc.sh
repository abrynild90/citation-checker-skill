#!/usr/bin/env bash
# Run scene checks from any checkout; optional scene IDs narrow the run.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if (($#)); then
  ONLY=$(IFS=,; echo "$*")
  export ONLY
fi
exec node tools/scene_check.mjs
