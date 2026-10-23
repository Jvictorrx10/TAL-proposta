#!/bin/sh
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo 'Instale o Node.js 24 pelo site https://nodejs.org e tente novamente.'
  exit 1
fi
exec node preview-local.mjs
