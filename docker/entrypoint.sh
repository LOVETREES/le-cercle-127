#!/bin/sh
set -eu

cd /app
if [ ! -f package.json ] || [ ! -f package-lock.json ]; then
    echo "Le dossier /app doit contenir package.json et package-lock.json." >&2
    exit 1
fi

dependency_hash="$(sha256sum package.json package-lock.json | sha256sum | cut -d ' ' -f 1)"
dependency_stamp=node_modules/.c127-dependencies.sha256

if [ ! -f "$dependency_stamp" ] || [ "$(cat "$dependency_stamp")" != "$dependency_hash" ] || [ ! -x node_modules/.bin/expo ]; then
    echo "Synchronisation des dépendances du projet Expo…"
    npm ci --no-audit --no-fund --strict-ssl=true
    printf '%s\n' "$dependency_hash" > "$dependency_stamp"
fi

exec "$@"
