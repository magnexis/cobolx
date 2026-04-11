#!/usr/bin/env bash
set -euo pipefail
npm install
npm run build
echo "COBOL-X built successfully."
