# Quick Setup Guide

This guide will help you set up the Closed-Loop Intervention Engine locally in under 10 minutes.

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/) or use [Supabase](https://supabase.com) free tier)
- **n8n** account ([Sign up](https://n8n.cloud) for free cloud instance)

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Alcovia
```

### 2. Database Setup

#### Option A: Local PostgreSQL

```bash
# Create database
createdb intervention_engine

# Or via psql
psql -U postgres
CREATE DATABASE intervention_engine;
\q
```

#### Option B: Supabase (Recommended for Quick Start)

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string (format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

### 3. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your values
# For Supabase:
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
# OR for local:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/intervention_engine

# Generate a random JWT secret
JWT_SECRET=$(openssl rand -base64 32)
# Or manually set:
JWT_SECRET=your-secret-key-change-in-production

# We'll set N8N_WEBHOOK_URL after setting up n8n
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/intervention

# Run migrations
npm run migrate

# Create test student
npx ts-node src/scripts/create-test-student.ts

# Start server
npm run dev
```

Backend should be running at `http://localhost:3000`

**Verify:** Open `http://localhost:3000/health` - should return `{"status":"ok",...}`

### 4. n8n Workflow Setup

#### Option A: n8n.cloud (Easiest)

1. Sign up at [n8n.cloud](https://n8n.cloud) (free tier available)
2. Create a new workflow
3. Click "Import from File" → Upload `n8n_workflow/intervention-workflow.json`
4. Configure the workflow:
   - **Webhook Node**: Copy the webhook URL (e.g., `https://your-instance.n8n.cloud/webhook/intervention`)
   - **Email Node**: 
     - Set up SMTP credentials (Gmail, SendGrid, etc.)
     - Configure `fromEmail`, `toEmail`
   - **Set Node**: Update environment variables:
     - `BACKEND_URL=http://localhost:3000` (for testing)
     - `BACKEND_URL=https://your-backend.com` (for production)
     - `MENTOR_EMAIL=your-email@example.com`
5. Activate the workflow
6. Copy the webhook URL to backend `.env`:
   ```
   N8N_WEBHOOK_URL=https://your-instance.n8n.cloud/webhook/intervention
   ```

#### Option B: Local n8n (Docker)

```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

Then:
1. Open `http://localhost:5678`
2. Complete setup wizard
3. Import workflow from `n8n_workflow/intervention-workflow.json`
4. Configure same as above
5. Use webhook URL: `http://localhost:5678/webhook/intervention` (use ngrok for testing)

**For testing locally with n8n cloud:** Use [ngrok](https://ngrok.com) to expose local backend:
```bash
ngrok http 3000
# Use the ngrok URL in n8n workflow: https://xxxxx.ngrok.io
```

### 5. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:3000" > .env
echo "REACT_APP_WS_URL=http://localhost:3000" >> .env

# Start dev server
npm start
```

Frontend should open at `http://localhost:3001` (or port shown in terminal)

### 6. Test the System

1. **Open the app**: `http://localhost:3001`
2. **Login**: Use student ID `1111-2222` (or click "Use Test Student")
3. **Submit a failing check-in**:
   - Enter quiz score: `4`
   - Start focus timer (or leave at 0 minutes)
   - Click "Submit Check-in"
4. **Verify**:
   - Status changes to "Locked"
   - Check backend logs: Should see n8n webhook call
   - Check your email: Should receive mentor notification
5. **Approve intervention**:
   - Click the approve link in email
   - Or manually call: `http://localhost:3000/api/v1/assign-intervention?student_id=1111-2222&task=Read%20Chapter%204&mentor=mentor@org&token=...`
   - Verify status changes to "Remedial" in app
6. **Complete intervention**:
   - Click "Mark Complete" in app
   - Verify status returns to "On Track"

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `psql $DATABASE_URL -c "SELECT 1;"`
- Verify migrations ran: `npm run migrate`
- Check `.env` file exists and has correct values

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:3000/health`
- Check `REACT_APP_API_URL` in `client/.env`
- Verify CORS is enabled in backend (check `server/src/index.ts`)

### n8n webhook not triggered
- Verify workflow is active in n8n
- Check `N8N_WEBHOOK_URL` in `server/.env` matches n8n webhook URL
- Test webhook manually:
  ```bash
  curl -X POST https://your-n8n-instance.com/webhook/intervention \
    -H "Content-Type: application/json" \
    -d '{"student_id":"1111-2222","quiz_score":4,"focus_minutes":30,"name":"Test Student"}'
  ```

### Database connection errors
- Verify PostgreSQL is running
- Check connection string format: `postgresql://user:password@host:port/database`
- For Supabase: Ensure IP is whitelisted (Settings → Database → Connection Pooling)

## Environment Variables Summary

### Backend (`server/.env`)
```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
JWT_SECRET=your-secret-key
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/intervention
CORS_ORIGIN=http://localhost:3001
QUIZ_PASS_SCORE=7
FOCUS_MIN_MINUTES=60
```

### Frontend (`client/.env`)
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=http://localhost:3000
```

### n8n (Workflow Settings)
- `BACKEND_URL`: Your backend URL
- `MENTOR_EMAIL`: Email to receive notifications

## Next Steps

- Read the full [README.md](README.md) for architecture details
- Review API documentation in README
- Check fail-safe design documentation
- Test all endpoints using the curl examples in README

## Production Deployment

See the [README.md](README.md) Deployment Checklist section for production deployment steps.

