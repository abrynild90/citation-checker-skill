#!/usr/bin/env bash
set -euo pipefail
exec "$(dirname "${BASH_SOURCE[0]}")/_runsc.sh" solwind dn2 starfish cosmos1408 viasat sj21-tug laser
