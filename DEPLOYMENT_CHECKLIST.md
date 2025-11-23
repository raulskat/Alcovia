# Deployment Checklist

This checklist will help you deploy all components of the Closed-Loop Intervention Engine.

## ✅ Pre-Deployment Checklist

- [ ] All code is committed to Git
- [ ] GitHub repository is created and pushed
- [ ] All tests pass locally
- [ ] Environment variables documented

## 🗄️ Step 1: Deploy Database

### Option A: Supabase (Recommended - Free Tier)

1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings → Database**
4. Copy the connection string:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Save this for backend deployment

### Option B: Railway

1. Sign up at [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy connection string from Variables tab

### Option C: AWS RDS / Other

Follow your provider's PostgreSQL setup guide.

**Action Items:**
- [ ] Database deployed
- [ ] Connection string saved
- [ ] Test connection works

---

## 🖥️ Step 2: Deploy Backend

### Option A: Railway (Recommended)

1. Sign up at [railway.app](https://railway.app)
2. Create new project → Add GitHub repo
3. Select `server` folder as root
4. Add environment variables:
   ```
   DATABASE_URL=postgresql://...
   PORT=3000
   JWT_SECRET=<generate-random-string>
   N8N_WEBHOOK_URL=<will-set-after-n8n>
   CORS_ORIGIN=<frontend-url>
   QUIZ_PASS_SCORE=7
   FOCUS_MIN_MINUTES=60
   MENTOR_RESPONSE_DEADLINE_HOURS=12
   AUTO_UNLOCK_HOURS=24
   ```
5. Set build command: `npm install && npm run build`
6. Set start command: `npm start`
7. Deploy

### Option B: Render

1. Sign up at [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Root Directory: `server`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add environment variables (same as above)
7. Deploy

### Option C: Vercel (Serverless Functions)

1. Install Vercel CLI: `npm i -g vercel`
2. In `server/` folder: `vercel`
3. Configure as Node.js project
4. Add environment variables
5. Deploy

**After Deployment:**
- [ ] Backend URL: `https://your-backend.railway.app` (or similar)
- [ ] Test health endpoint: `GET https://your-backend.railway.app/health`
- [ ] Run migrations: Connect to DB and run `npm run migrate` locally with production DATABASE_URL
- [ ] Create test student: Run `npm run create-test-student` with production DATABASE_URL

**Action Items:**
- [ ] Backend deployed
- [ ] Health check works
- [ ] Migrations applied
- [ ] Test student created

---

## 🎨 Step 3: Deploy Frontend

### Option A: Vercel (Recommended)

1. Sign up at [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Root Directory: `client`
4. Framework Preset: **Other**
5. Build Command: `npm install && npm run build`
6. Output Directory: `web-build`
7. Add environment variables:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app
   REACT_APP_WS_URL=https://your-backend.railway.app
   ```
8. Deploy

### Option B: Netlify

1. Sign up at [netlify.com](https://netlify.com)
2. New site from Git → Connect GitHub
3. Base directory: `client`
4. Build command: `npm install && npm run build`
5. Publish directory: `web-build`
6. Add environment variables (same as above)
7. Deploy

### Option C: Expo Web Hosting

1. Install Expo CLI: `npm i -g expo-cli`
2. In `client/` folder: `expo export:web`
3. Deploy `web-build` folder to any static host

**After Deployment:**
- [ ] Frontend URL: `https://your-app.vercel.app` (or similar)
- [ ] Test app loads
- [ ] Test login with test student ID
- [ ] Verify API calls work (check browser Network tab)

**Action Items:**
- [ ] Frontend deployed
- [ ] App loads correctly
- [ ] Can login with test student
- [ ] API integration works

---

## 🔄 Step 4: Set Up n8n Workflow

### Option A: n8n.cloud (Recommended)

1. Sign up at [n8n.cloud](https://n8n.cloud) (free tier available)
2. Create new workflow
3. Click **Import from File**
4. Upload `n8n_workflow/intervention-workflow.json`
5. Configure nodes:
   - **Webhook Node**: Copy webhook URL (e.g., `https://your-instance.n8n.cloud/webhook/intervention`)
   - **Email Node**: Set up SMTP credentials (Gmail, SendGrid, etc.)
     - From: `mentor@yourorg.com`
     - To: `{{ $env.MENTOR_EMAIL }}`
   - **Set Node**: Update environment variables:
     - `BACKEND_URL`: Your backend URL (e.g., `https://your-backend.railway.app`)
     - `MENTOR_EMAIL`: Your email address
6. Activate workflow
7. Copy webhook URL to backend environment variables: `N8N_WEBHOOK_URL`

### Option B: Self-Hosted n8n

1. Deploy n8n on Railway/Render/Docker
2. Follow same configuration steps
3. Use ngrok for local testing if needed

**After Setup:**
- [ ] n8n workflow active
- [ ] Webhook URL copied to backend
- [ ] Test webhook manually:
   ```bash
   curl -X POST https://your-n8n-instance.com/webhook/intervention \
     -H "Content-Type: application/json" \
     -d '{"student_id":"1111-2222","quiz_score":4,"focus_minutes":30,"name":"Test Student"}'
   ```
- [ ] Verify email received

**Action Items:**
- [ ] n8n workflow deployed
- [ ] Webhook URL configured in backend
- [ ] Email notifications working
- [ ] Test webhook call successful

---

## 🔄 Step 5: Update Backend with n8n URL

After n8n is set up:

1. Go to your backend deployment (Railway/Render)
2. Update environment variable: `N8N_WEBHOOK_URL`
3. Redeploy backend (or it will auto-redeploy)

**Action Items:**
- [ ] Backend updated with n8n webhook URL
- [ ] Backend redeployed

---

## ✅ Step 6: End-to-End Testing

Test the complete flow:

1. **Open Frontend**: `https://your-app.vercel.app`
2. **Login**: Use test student ID (e.g., `1111-2222`)
3. **Submit Failing Check-in**:
   - Quiz Score: `4`
   - Focus Minutes: `30`
   - Click "Submit Check-in"
4. **Verify Locked State**: App should show "Analysis in progress. Waiting for Mentor..."
5. **Check Email**: You should receive mentor notification email
6. **Approve Intervention**: Click approve link in email
7. **Verify Remedial State**: App should unlock and show intervention task
8. **Complete Task**: Click "Mark Complete"
9. **Verify Normal State**: Status should return to "On Track"

**Action Items:**
- [ ] Complete flow tested end-to-end
- [ ] All states working (Normal/Locked/Remedial)
- [ ] Email notifications working
- [ ] WebSocket updates working (if implemented)
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

## 📹 Step 7: Record Loom Video

Before recording:

- [ ] All components deployed and working
- [ ] Test student created
- [ ] Email notifications working
- [ ] Have test data ready

**Video Script (5 minutes max):**

1. **Introduction** (30s): "This is the Closed-Loop Intervention Engine..."
2. **Show Normal State** (30s): Login, show focus timer, submit passing check-in
3. **Trigger Intervention** (1min): Submit failing check-in, show locked state
4. **Show n8n Email** (1min): Open email, show approval link
5. **Approve & Unlock** (1min): Click approve, show app unlocking in real-time
6. **Complete Task** (30s): Mark intervention complete, return to normal
7. **Wrap-up** (30s): Summary of the closed-loop system

**Action Items:**
- [ ] Loom video recorded
- [ ] Video link saved
- [ ] Video demonstrates complete flow

---

## 📝 Step 8: Update Documentation

Update `README.md` with:

- [ ] Live app URL
- [ ] Backend URL
- [ ] GitHub repository link
- [ ] Any deployment-specific notes

**Action Items:**
- [ ] README updated with live URLs
- [ ] All links working

---

## 🎯 Final Submission Checklist

Before submitting to Google Form:

- [ ] ✅ Live App URL (deployed frontend)
- [ ] ✅ GitHub Repository (public, with all code)
- [ ] ✅ n8n Workflow JSON (in `/n8n_workflow` folder)
- [ ] ✅ Loom Video (max 5 min, demonstrating full loop)
- [ ] ✅ README (with architecture, fail-safe, deployment guide)

**Submission Form**: https://forms.gle/1Qq9bcR7KPE6ZAgUA

**Deadline**: 9pm, 24th November 2025

---

## 🚨 Troubleshooting Deployment

### Backend won't start
- Check environment variables are set correctly
- Verify database connection string
- Check build logs for errors
- Ensure migrations ran successfully

### Frontend can't connect to backend
- Verify `REACT_APP_API_URL` is correct
- Check CORS settings in backend
- Verify backend is accessible (test health endpoint)

### n8n webhook not working
- Verify workflow is active
- Check webhook URL is correct in backend env vars
- Test webhook manually with curl
- Check n8n execution logs

### Database connection errors
- Verify connection string format
- Check database is accessible from deployment platform
- For Supabase: Check IP whitelist settings
- Verify database exists and migrations ran

---

## 📞 Quick Reference

**Environment Variables Summary:**

**Backend:**
```
DATABASE_URL=postgresql://...
PORT=3000
JWT_SECRET=<random-string>
N8N_WEBHOOK_URL=https://...
CORS_ORIGIN=https://your-frontend.com
QUIZ_PASS_SCORE=7
FOCUS_MIN_MINUTES=60
MENTOR_RESPONSE_DEADLINE_HOURS=12
AUTO_UNLOCK_HOURS=24
```

**Frontend:**
```
REACT_APP_API_URL=https://your-backend.com
REACT_APP_WS_URL=https://your-backend.com
```

**n8n:**
```
BACKEND_URL=https://your-backend.com
MENTOR_EMAIL=your-email@example.com
```

Good luck with your deployment! 🚀

