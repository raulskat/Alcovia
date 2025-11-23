# PowerShell script to run migrations on production database
# Usage: $env:DATABASE_URL="postgresql://..."; .\run-production-migrations.ps1

Write-Host "🚀 Running migrations on production database..." -ForegroundColor Green

# Set NODE_ENV to production
$env:NODE_ENV = "production"

# Run migrations
npx knex migrate:latest --knexfile knexfile.cjs

Write-Host "✅ Migrations complete!" -ForegroundColor Green

