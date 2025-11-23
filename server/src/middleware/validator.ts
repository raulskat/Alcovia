import { Request, Response, NextFunction } from 'express';

export function validateCheckinPayload(req: Request, res: Response, next: NextFunction): void {
  const { student_id, quiz_score, focus_minutes } = req.body;

  if (!student_id || typeof quiz_score !== 'number' || typeof focus_minutes !== 'number') {
    res.status(400).json({ error: 'Missing required fields: student_id, quiz_score, focus_minutes' });
    return;
  }

  next();
}

