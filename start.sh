#!/usr/bin/env bash
# LONGVIEW 로컬 미리보기 (macOS / Linux / Git Bash) · dist/ 를 127.0.0.1:5173 에 띄웁니다.
cd "$(dirname "$0")"
PY=$(command -v python3 || command -v python) || { echo "Python 3 가 필요합니다."; exit 1; }
echo "LONGVIEW 미리보기: http://127.0.0.1:5173/  (끝내려면 Ctrl+C)"
( command -v open >/dev/null && open http://127.0.0.1:5173/ ) || ( command -v xdg-open >/dev/null && xdg-open http://127.0.0.1:5173/ ) || true
exec "$PY" -m http.server 5173 --bind 127.0.0.1 --directory dist
