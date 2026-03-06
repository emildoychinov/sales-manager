#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== Backend (pytest) ==="
cd "$ROOT/backend"
python3 -m pytest tests/ -v
BACKEND_EXIT=$?

echo ""
echo "=== Frontend (vitest) ==="
cd "$ROOT/frontend"
npm test
FRONTEND_EXIT=$?

echo ""
if [ $BACKEND_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]; then
  echo "All tests passed."
else
  echo "Some tests failed. Backend: $BACKEND_EXIT, Frontend: $FRONTEND_EXIT"
  exit 1
fi
