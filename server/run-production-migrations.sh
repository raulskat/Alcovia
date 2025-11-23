#!/bin/bash

# Run migrations on production database
# Usage: DATABASE_URL="postgresql://..." ./run-production-migrations.sh

echo "🚀 Running migrations on production database..."

# Set NODE_ENV to production to use production config
export NODE_ENV=production

# Run migrations
npx knex migrate:latest --knexfile knexfile.cjs

echo "✅ Migrations complete!"

