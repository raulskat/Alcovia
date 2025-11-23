# Closed-Loop Intervention Engine

A production-ready, SOLID-principle-based full-stack application that implements a closed-loop intervention system: **Student App → Backend → n8n (Mentor) → Backend → Student App**.

## 🎯 Goal

Fast prototype of a Closed-Loop Intervention Engine that monitors student performance, automatically notifies mentors when intervention is needed, and manages the complete lifecycle from detection to resolution.

## 🏗️ Architecture Overview

### High-Level Flow

```
┌─────────────┐      ┌──────────────┐      ┌────────────┐      ┌──────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│    n8n     │─────▶│   Backend    │
│  (React)    │◀─────│  (Express)   │◀─────│ (Workflow) │      │  (Express)   │
└─────────────┘      └──────────────┘      └────────────┘      └──────────────┘
       │                    │
       │                    │
       └────────────────────┘
         WebSocket Updates
```

### Components

1. **Frontend (React/Expo Web)**: Student-facing app with Focus Timer & Daily Quiz
2. **Backend (Node.js/Express)**: REST API + WebSocket + Business Logic
3. **Database (PostgreSQL)**: Stores students, logs, interventions, mentor actions
4. **Automation (n8n)**: Receives webhooks, sends mentor notifications, handles approval workflow
5. **Fail-Safe Worker**: Background process for auto-escalation and auto-unlock

## 📐 SOLID Principles Applied

### Single Responsibility
- **Controllers**: Handle HTTP requests only
- **Services**: Contain business logic only
- **Repositories**: Handle database operations only
- **Notifiers**: Handle external notifications only

### Open/Closed
- Logic gates (pass/fail thresholds) are configurable via environment variables
- Service interfaces allow extension without modification (e.g., EmailNotifier vs N8nNotifier)

### Liskov Substitution
- Services implementing `INotifier` interface are interchangeable
- Repository interfaces ensure substitutability

### Interface Segregation
- Small, focused interfaces: `IStudentRepo`, `IInterventionService`, `INotifier`
- Clients depend only on methods they use

### Dependency Inversion
- High-level modules depend on abstractions (interfaces)
- Dependencies injected via constructors
- Makes testing and replacement easy

## 🗄️ Database Schema

```sql
-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'On Track',
  last_intervention_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Daily logs table
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  quiz_score INT NOT NULL,
  focus_minutes INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Interventions table
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  assigned_by TEXT,
  task TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  mentor_deadline TIMESTAMP WITH TIME ZONE NULL
);

-- Mentor actions table
CREATE TABLE mentor_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID REFERENCES interventions(id),
  mentor TEXT,
  action TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_daily_logs_student_created ON daily_logs (student_id, created_at DESC);
```

## 🔌 API Contract

Base path: `/api/v1`

### POST /daily-checkin

Submits daily check-in with quiz score and focus minutes.

**Payload:**
```json
{
  "student_id": "uuid",
  "quiz_score": 4,
  "focus_minutes": 30
}
```

**Response (Pass):**
```json
{
  "status": "On Track"
}
```

**Response (Fail):**
```json
{
  "status": "Pending Mentor Review",
  "intervention_id": "uuid"
}
```

**Logic Gate:**
- Pass: `quiz_score > 7` AND `focus_minutes > 60`
- Fail: Otherwise → triggers intervention workflow

---

### POST /assign-intervention

Assigns intervention task to student (called by n8n after mentor approval).

**Payload:**
```json
{
  "student_id": "uuid",
  "intervention_task": "Read Chapter 4",
  "mentor": "mentor@org"
}
```

**Query Params (for mentor approval links):**
```
?student_id=uuid&task=Read%20Chapter%204&mentor=mentor@org&token=jwt_token
```

**Response:**
```json
{
  "status": "assigned",
  "task": "Read Chapter 4"
}
```

---

### GET /student/:id/state

Returns current student state and active intervention.

**Response:**
```json
{
  "student_id": "uuid",
  "status": "Remedial",
  "active_intervention": {
    "id": "uuid",
    "task": "Read Chapter 4",
    "status": "assigned"
  }
}
```

---

### POST /mark-complete

Marks intervention as complete and restores student to "On Track".

**Payload:**
```json
{
  "student_id": "uuid",
  "intervention_id": "uuid"
}
```

**Response:**
```json
{
  "status": "On Track"
}
```

---

### WebSocket Events

**Event: `student_status_changed`**
```json
{
  "student_id": "uuid",
  "status": "Remedial",
  "intervention": {
    "id": "uuid",
    "task": "Read Chapter 4",
    "status": "assigned"
  },
  "timestamp": "2025-11-22T12:00:00Z"
}
```

**Client Subscription:**
```javascript
socket.emit('subscribe_student', studentId);
socket.on('student_status_changed', (data) => {
  // Handle status change
});
```

## 🔄 n8n Workflow

The n8n workflow handles mentor notifications and approvals:

1. **Webhook Trigger**: Receives POST from backend when student fails
2. **Format Data**: Structures the payload with student info and approval links
3. **Send Email**: Emails mentor with:
   - Student stats
   - Approve link (signed JWT token)
   - Reject/Escalate link
4. **Wait for Approval**: Mentor clicks approve link → n8n resumes
5. **Assign Intervention**: Calls backend `/assign-intervention` endpoint

**Setup:**
1. Import `n8n_workflow/intervention-workflow.json` into n8n
2. Configure webhook URL in backend `N8N_WEBHOOK_URL`
3. Set up SMTP credentials in n8n for email node
4. Configure environment variables: `BACKEND_URL`, `MENTOR_EMAIL`

## 🛡️ Fail-Safe Design

### Primary Measure: Auto-Escalation + TTL

When a student needs intervention:
1. Backend creates intervention with `mentor_deadline = now() + 12 hours`
2. Background worker (cron) checks every 10 minutes for overdue interventions
3. Escalation logic:
   - **Before 24h**: Escalate to Head Mentor (log action, send notification)
   - **After 24h**: Auto-unlock with default task ("Auto-assigned: Watch Lecture 3")
   - Set student status to `Remedial` and log auto-unlock reason

### Implementation

Located in `server/src/workers/escalationWorker.ts`:
- Runs every 10 minutes
- Checks `interventions` table for `mentor_deadline < now()`
- Handles escalation vs auto-unlock based on time threshold
- Logs all actions to `mentor_actions` table

### Security/UX Note

When auto-unlock occurs, communicate to student in-app why it happened (e.g., "No mentor response received. Auto-assigned default task.")

## 🚀 Deployment Checklist

### Backend Deployment

1. **Database Setup**
   - Deploy PostgreSQL (Supabase, Railway, AWS RDS)
   - Apply migrations: `npm run migrate`
   - Verify tables created

2. **Backend Hosting** (Vercel/Render/Heroku/Railway/Cloud Run)
   - Set environment variables:
     ```
     DATABASE_URL=postgresql://...
     PORT=3000
     JWT_SECRET=your-secret-key
     N8N_WEBHOOK_URL=https://your-n8n.com/webhook/intervention
     CORS_ORIGIN=https://your-frontend-domain.com
     QUIZ_PASS_SCORE=7
     FOCUS_MIN_MINUTES=60
     MENTOR_RESPONSE_DEADLINE_HOURS=12
     AUTO_UNLOCK_HOURS=24
     ```
   - Run `npm run build && npm start`

3. **Health Check**
   - Test: `GET https://your-backend.com/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

### Frontend Deployment

1. **Hosting** (Vercel/Netlify/Expo Web)
   - Set environment variables:
     ```
     REACT_APP_API_URL=https://your-backend.com
     REACT_APP_WS_URL=https://your-backend.com
     ```
   - Build: `npm run build` (or `expo export:web`)
   - Deploy static files

2. **Verify**
   - App loads at deployed URL
   - Can login with test student
   - API calls work (check browser network tab)

### n8n Deployment

1. **Option A: n8n.cloud** (Recommended)
   - Sign up at n8n.cloud
   - Import workflow JSON from `n8n_workflow/intervention-workflow.json`
   - Configure webhook URL in backend
   - Set up SMTP credentials for email node
   - Test webhook manually

2. **Option B: Self-hosted**
   - Docker: `docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n`
   - Configure same as above

### Verification Steps

1. Create test student in database:
   ```sql
   INSERT INTO students (id, name, email, status) 
   VALUES ('1111-2222', 'Test Student', 'test@example.com', 'On Track');
   ```

2. End-to-end test:
   - Open frontend app
   - Login with student ID: `1111-2222`
   - Submit failing check-in (quiz_score: 4, focus_minutes: 30)
   - Verify backend calls n8n webhook
   - Check mentor receives email
   - Click approve link in email
   - Verify student status changes to "Remedial"
   - Complete intervention task in app
   - Verify student returns to "On Track"

## 📋 Developer Playbook (Quick Start)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- n8n account (n8n.cloud or local instance)

### Step 1: Clone & Setup

```bash
git clone <repo-url>
cd Alcovia
```

### Step 2: Backend Setup

```bash
cd server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values:
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET (generate random string)
# - N8N_WEBHOOK_URL (from n8n workflow)
# - CORS_ORIGIN (frontend URL)

# Run migrations
npm run migrate

# Start dev server
npm run dev
```

Backend should be running at `http://localhost:3000`

### Step 3: Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Create .env file
echo "REACT_APP_API_URL=http://localhost:3000" > .env
echo "REACT_APP_WS_URL=http://localhost:3000" >> .env

# Start dev server
npm start
```

Frontend should open at `http://localhost:3001` (or port shown)

### Step 4: n8n Workflow Setup

1. Open n8n (local or cloud)
2. Import workflow from `n8n_workflow/intervention-workflow.json`
3. Configure:
   - Webhook URL (copy from n8n)
   - Email node with SMTP credentials
   - Environment variables in n8n settings:
     - `BACKEND_URL=http://localhost:3000`
     - `MENTOR_EMAIL=your-email@example.com`
4. Activate workflow
5. Copy webhook URL to backend `.env` as `N8N_WEBHOOK_URL`

### Step 5: Create Test Student

```sql
INSERT INTO students (id, name, email, status) 
VALUES ('1111-2222', 'Test Student', 'test@example.com', 'On Track');
```

### Step 6: Test the System

1. Open frontend: `http://localhost:3001`
2. Login with student ID: `1111-2222`
3. Submit failing check-in:
   - Start focus timer (or enter 0 minutes)
   - Enter quiz score: 4
   - Click "Submit Check-in"
4. Verify:
   - Status changes to "Locked"
   - Check backend logs for n8n webhook call
   - Check email for mentor notification
5. Click approve link in email
6. Verify student status changes to "Remedial" in app
7. Complete intervention task
8. Verify status returns to "On Track"

## 🧪 Testing

### Unit Tests

```bash
cd server
npm test
```

Tests should cover:
- InterventionService logic gate (pass/fail thresholds)
- Repository methods
- Token signing/verification

### Integration Tests

Test API endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Daily check-in (pass)
curl -X POST http://localhost:3000/api/v1/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{"student_id":"1111-2222","quiz_score":8,"focus_minutes":65}'

# Daily check-in (fail)
curl -X POST http://localhost:3000/api/v1/daily-checkin \
  -H "Content-Type: application/json" \
  -d '{"student_id":"1111-2222","quiz_score":4,"focus_minutes":30}'

# Get student state
curl http://localhost:3000/api/v1/student/1111-2222/state

# Mark complete
curl -X POST http://localhost:3000/api/v1/mark-complete \
  -H "Content-Type: application/json" \
  -d '{"student_id":"1111-2222","intervention_id":"..."}'
```

### E2E Manual Test Checklist

- [ ] Student can login
- [ ] Focus timer starts and counts minutes
- [ ] Tab switch detection stops timer (cheater detection)
- [ ] Daily check-in submission works
- [ ] Pass → status stays "On Track"
- [ ] Fail → status changes to "Locked", n8n webhook called
- [ ] Mentor receives email with approval link
- [ ] Approval link works (signed token verified)
- [ ] Status changes to "Remedial" after approval
- [ ] Intervention task displayed in app
- [ ] Mark complete works
- [ ] Status returns to "On Track"
- [ ] WebSocket updates work in real-time
- [ ] Fail-safe worker escalates after deadline

## 🔒 Security Considerations

1. **Input Validation**: All endpoints validate input types and ranges
2. **Token Signing**: Mentor action links signed with JWT (1h TTL)
3. **Parameterized Queries**: All DB queries use parameterized statements (Knex)
4. **CORS**: Configured for frontend domain only
5. **Environment Variables**: Sensitive configs stored in `.env`
6. **Rate Limiting**: Recommended for production (add express-rate-limit)

## 📦 Project Structure

```
.
├── server/                 # Backend (Node.js/Express)
│   ├── src/
│   │   ├── controllers/    # HTTP handlers
│   │   ├── services/       # Business logic (SOLID)
│   │   ├── repositories/   # Data access layer
│   │   ├── notifiers/      # External notifications
│   │   ├── workers/        # Background tasks (fail-safe)
│   │   ├── websocket/      # Socket.io manager
│   │   ├── db/             # Database connection & migrations
│   │   ├── config/         # Configuration
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utilities (token signing, etc.)
│   ├── package.json
│   └── tsconfig.json
│
├── client/                 # Frontend (React/Expo Web)
│   ├── src/
│   │   ├── pages/          # LoginPage, FocusModePage
│   │   ├── contexts/       # StudentContext (state management)
│   │   ├── api.ts          # API client
│   │   └── config.ts       # Frontend config
│   ├── package.json
│   └── App.tsx
│
├── n8n_workflow/           # n8n workflow JSON
│   └── intervention-workflow.json
│
└── README.md               # This file
```

## 🎬 Demo Recording Checklist

Before recording Loom video:

- [ ] All components deployed and accessible
- [ ] Test student created in database
- [ ] n8n workflow active and tested
- [ ] Email notifications working
- [ ] Frontend connected to backend
- [ ] WebSocket connection working

**Demo Flow:**
1. Show login page → login with test student
2. Show normal state → start timer → submit passing check-in
3. Submit failing check-in → show locked state
4. Show mentor email (or n8n execution logs)
5. Click approval → show status change to remedial
6. Complete intervention → show return to "On Track"

## 📝 Minimal Deliverable Checklist

- [x] ✅ Live App URL (web)
- [x] ✅ GitHub repo with folders: `server`, `client`, `n8n_workflow`
- [x] ✅ n8n workflow JSON in `/n8n_workflow`
- [ ] 📹 Loom video (<5 min) demonstrating full loop
- [x] ✅ README describing architecture, fail-safe, how to run locally, env vars
- [x] ✅ Developer playbook with exact step-by-step

## 🚨 Troubleshooting

### Backend won't start
- Check PostgreSQL connection: `psql $DATABASE_URL`
- Verify migrations ran: `npm run migrate`
- Check environment variables in `.env`

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` in client `.env`
- Check CORS settings in backend
- Verify backend is running on correct port

### n8n webhook not triggered
- Verify `N8N_WEBHOOK_URL` in backend `.env` matches n8n webhook URL
- Check n8n workflow is active
- Verify webhook accepts POST requests
- Check backend logs for n8n call errors

### WebSocket not working
- Verify `REACT_APP_WS_URL` in client `.env`
- Check Socket.io CORS settings
- Verify client subscribes to student: `socket.emit('subscribe_student', studentId)`

## 📄 License

ISC

## 👤 Author

Built following SOLID principles for production-minded development.

