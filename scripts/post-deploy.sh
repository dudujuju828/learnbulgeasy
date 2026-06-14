#!/bin/bash

# Run migrations on Vercel deploy
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set, skipping migrations"
  exit 0
fi

echo "Running database migrations..."
curl -s -X POST http://localhost:3000/api/db/migrate \
  -H "Content-Type: application/json" \
  -H "x-migration-secret: $MIGRATION_SECRET" \
  -d '{}' || echo "Migrations may have already run"
