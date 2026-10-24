#!/bin/bash
set -eu
cd -- "$(dirname -- "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Please install Node.js LTS, then run this file again."
  read -r -p "Press Enter to close. " _
  exit 1
fi
exec node server.cjs --open
