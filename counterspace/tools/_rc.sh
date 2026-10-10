#!/usr/bin/env bash
# Check a single scene using the standard OUT, VPS, PORT and MODES options.
set -euo pipefail
if (($# != 1)); then
  echo 'usage: _rc.sh scene-id' >&2
  exit 2
fi
exec "$(dirname "${BASH_SOURCE[0]}")/_runsc.sh" "$1"
