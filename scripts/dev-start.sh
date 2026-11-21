#!/bin/sh

rm -f /tmp/app-setup-finished

bun install --frozen-lockfile && bunx prisma migrate deploy
setup_status=$?

touch /tmp/app-setup-finished

if [ "$setup_status" -eq 0 ]; then
  exec bunx next dev --hostname 0.0.0.0
fi

echo "app: setup failed, fix the error above and run: docker compose restart app" >&2
exec sleep infinity
