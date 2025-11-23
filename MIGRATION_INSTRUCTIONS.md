# Running Migrations on Production Database

Your backend is deployed but migrations haven't been run yet. Follow these steps:

## Option 1: Run Migrations Locally (Recommended)

### On Windows (PowerShell):

1. Navigate to the `server` folder:
   ```powershell
   cd server
   ```

2. Set the production DATABASE_URL and run migrations:
   ```powershell
   $env:DATABASE_URL="postgresql://postgres:WmMtlzxSqNTzikLCVgOcrUkvrWeUzwDy@turntable.proxy.rlwy.net:33721/railway"
   $env:NODE_ENV="production"
   npm run migrate
   ```

### On Mac/Linux:

1. Navigate to the `server` folder:
   ```bash
   cd server
   ```

2. Set the production DATABASE_URL and run migrations:
   ```bash
   export DATABASE_URL="postgresql://postgres:WmMtlzxSqNTzikLCVgOcrUkvrWeUzwDy@turntable.proxy.rlwy.net:33721/railway"
   export NODE_ENV=production
   npm run migrate
   ```

## Option 2: Run Migrations via psql (Direct SQL)

If you prefer to run SQL directly:

1. Connect to the database:
   ```bash
   PGPASSWORD=WmMtlzxSqNTzikLCVgOcrUkvrWeUzwDy psql -h turntable.proxy.rlwy.net -U postgres -p 33721 -d railway
   ```

2. Run the SQL from the migration file. The migration creates:
   - `students` table
   - `daily_logs` table
   - `interventions` table
   - `mentor_actions` table
   - Indexes

## Option 3: Add Migration to Render Build (Future)

You can modify Render's build command to run migrations automatically:

**Build Command:**
```bash
npm install && npm run build && npm run migrate
```

**Note:** This requires DATABASE_URL to be set in Render environment variables.

## After Running Migrations

1. **Verify tables exist:**
   ```sql
   \dt
   ```
   You should see: `students`, `daily_logs`, `interventions`, `mentor_actions`

2. **Create a test student:**
   ```powershell
   # In server folder
   $env:DATABASE_URL="postgresql://postgres:WmMtlzxSqNTzikLCVgOcrUkvrWeUzwDy@turntable.proxy.rlwy.net:33721/railway"
   npm run create-test-student
   ```

3. **Test the backend:**
   - Health check: `https://alcovia.onrender.com/health`
   - Should return: `{"status":"ok",...}`

## Quick Commands Summary

**Run migrations:**
```powershell
cd server
$env:DATABASE_URL="postgresql://postgres:WmMtlzxSqNTzikLCVgOcrUkvrWeUzwDy@turntable.proxy.rlwy.net:33721/railway"
$env:NODE_ENV="production"
npm run migrate
```

**Create test student:**
```powershell
cd server
$env:DATABASE_URL="postgresql://postgres:WmMtlzxSqNTzikLCVgOcrUkvrWeUzwDy@turntable.proxy.rlwy.net:33721/railway"
npm run create-test-student
```

**Verify backend:**
```powershell
curl https://alcovia.onrender.com/health
```

