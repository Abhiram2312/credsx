#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing '$1'. Install it, then run make again."
    exit 1
  fi
}

need podman
need uv
need npm

echo "Checking Podman..."
if ! podman info >/dev/null 2>&1; then
  if ! podman machine start; then
    podman machine init
    podman machine start
  fi
fi

echo "Starting Postgres..."
podman compose up -d

echo "Waiting for Postgres..."
ready=0
for _ in $(seq 1 40); do
  if podman compose exec -T db pg_isready -U cards -d cards >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "$ready" -ne 1 ]]; then
  echo "Postgres did not become ready."
  exit 1
fi

echo "Installing API dependencies..."
(cd "$root/api" && uv sync)

echo "Installing web dependencies..."
(cd "$root/web" && npm install)

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill -- -"$API_PID" 2>/dev/null || kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting the API on http://127.0.0.1:8000"
set -m
(cd "$root/api" && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000) &
API_PID=$!

sleep 1
if ! kill -0 "$API_PID" 2>/dev/null; then
  echo "The API stopped. Port 8000 may already be in use."
  exit 1
fi

echo "Starting the site on http://127.0.0.1:5173"
cd "$root/web"
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
