import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { InterventionController } from './controllers/InterventionController';
import { InterventionService } from './services/InterventionService';
import { StudentRepo } from './repositories/StudentRepo';
import { DailyLogRepo } from './repositories/DailyLogRepo';
import { InterventionRepo } from './repositories/InterventionRepo';
import { MentorActionRepo } from './repositories/MentorActionRepo';
import { N8nNotifier } from './notifiers/N8nNotifier';
import { WebSocketManager } from './websocket/WebSocketManager';
import { errorHandler } from './middleware/errorHandler';
import { EscalationWorker } from './workers/escalationWorker';
import { config } from './config';

dotenv.config();

const app: Application = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8081';

// CORS configuration - allow localhost and all Vercel preview URLs
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow all Vercel preview URLs
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Allow specific CORS_ORIGIN if set
    if (CORS_ORIGIN && origin === CORS_ORIGIN) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true 
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Initialize repositories (Dependency Injection)
const studentRepo = new StudentRepo();
const logRepo = new DailyLogRepo();
const interventionRepo = new InterventionRepo();
const mentorActionRepo = new MentorActionRepo();

// Initialize notifier
const notifier = new N8nNotifier();

// Initialize service with dependencies
const interventionService = new InterventionService(
  studentRepo,
  logRepo,
  interventionRepo,
  notifier
);

// Initialize controller
const interventionController = new InterventionController(
  interventionService,
  studentRepo,
  interventionRepo
);

// Initialize WebSocket - pass function to check origin
const wsManager = new WebSocketManager(httpServer, corsOptions.origin);

// Helper to emit status changes
const emitStatusChange = (studentId: string, status: any) => {
  interventionRepo.getActiveByStudentId(studentId).then((intervention) => {
    wsManager.emitStudentStatusChanged(
      studentId,
      status,
      intervention ? { id: intervention.id, task: intervention.task, status: intervention.status } : undefined
    );
  });
};

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/v1/daily-checkin', (req, res) => {
  interventionController.dailyCheckin(req, res).then(() => {
    // Emit status change if needed
    if (req.body.student_id) {
      studentRepo.getById(req.body.student_id).then((student) => {
        if (student) {
          emitStatusChange(student.id, student.status);
        }
      });
    }
  });
});

app.post('/api/v1/assign-intervention', (req, res) => {
  interventionController.assignIntervention(req, res).then(() => {
    // Emit status change
    const studentId = req.body.student_id || req.query.student_id;
    if (studentId) {
      emitStatusChange(studentId, 'Remedial');
    }
  });
});

app.get('/api/v1/student/:id/state', (req, res) => {
  interventionController.getStudentState(req, res);
});

app.post('/api/v1/mark-complete', (req, res) => {
  interventionController.markComplete(req, res).then(() => {
    // Emit status change
    if (req.body.student_id) {
      emitStatusChange(req.body.student_id, 'On Track');
    }
  });
});

// Error handler
app.use(errorHandler);

// Start escalation worker
if (process.env.NODE_ENV !== 'test') {
  const escalationWorker = new EscalationWorker();
  escalationWorker.start();
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket enabled for real-time updates`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Config: QUIZ_PASS=${config.thresholds.QUIZ_PASS_SCORE}, FOCUS_MIN=${config.thresholds.FOCUS_MIN_MINUTES}`);
});

export default app;

