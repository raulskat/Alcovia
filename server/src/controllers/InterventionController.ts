import { Request, Response } from 'express';
import { InterventionService } from '../services/InterventionService';
import { IStudentRepo, IInterventionRepo } from '../repositories/interfaces';
import { StudentStateResponse } from '../types';
import { verifyMentorActionToken } from '../utils/token';

export class InterventionController {
  constructor(
    private interventionService: InterventionService,
    private studentRepo: IStudentRepo,
    private interventionRepo: IInterventionRepo
  ) {}

  async dailyCheckin(req: Request, res: Response): Promise<void> {
    try {
      const { student_id, quiz_score, focus_minutes } = req.body;

      // Validate input
      if (!student_id || typeof quiz_score !== 'number' || typeof focus_minutes !== 'number') {
        res.status(400).json({ error: 'Missing required fields: student_id, quiz_score, focus_minutes' });
        return;
      }

      if (quiz_score < 0 || quiz_score > 10 || focus_minutes < 0) {
        res.status(400).json({ error: 'Invalid quiz_score (0-10) or focus_minutes (>=0)' });
        return;
      }

      const result = await this.interventionService.handleDailyCheckin({
        student_id,
        quiz_score,
        focus_minutes,
      });

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in dailyCheckin:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async assignIntervention(req: Request, res: Response): Promise<void> {
    try {
      // Support both query params (from mentor link) and body (from n8n)
      const student_id = req.body.student_id || req.query.student_id;
      const intervention_task = req.body.intervention_task || req.query.task;
      const mentor = req.body.mentor || req.query.mentor || 'mentor@org';
      const token = req.query.token as string;

      // Verify token if present (from mentor approval link)
      if (token) {
        try {
          const tokenPayload = verifyMentorActionToken(token);
          // Use token payload if student_id matches
          if (tokenPayload.student_id !== student_id) {
            res.status(403).json({ error: 'Token does not match student_id' });
            return;
          }
        } catch (tokenError: any) {
          res.status(403).json({ error: 'Invalid or expired token' });
          return;
        }
      }

      if (!student_id || !intervention_task) {
        res.status(400).json({ error: 'Missing required fields: student_id, intervention_task' });
        return;
      }

      await this.interventionService.assignIntervention({
        student_id,
        intervention_task,
        mentor,
      });

      res.status(200).json({ status: 'assigned', task: intervention_task });
    } catch (error: any) {
      console.error('Error in assignIntervention:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async getStudentState(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const student = await this.studentRepo.getById(id);
      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      let activeIntervention = null;
      if (student.status === 'Remedial' || student.status === 'Locked') {
        activeIntervention = await this.interventionRepo.getActiveByStudentId(id);
      }

      const response: StudentStateResponse = {
        student_id: student.id,
        status: student.status,
        active_intervention: activeIntervention
          ? {
              id: activeIntervention.id,
              task: activeIntervention.task,
              status: activeIntervention.status,
            }
          : undefined,
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error('Error in getStudentState:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }

  async markComplete(req: Request, res: Response): Promise<void> {
    try {
      const { student_id, intervention_id } = req.body;

      if (!student_id || !intervention_id) {
        res.status(400).json({ error: 'Missing required fields: student_id, intervention_id' });
        return;
      }

      await this.interventionService.markInterventionComplete(student_id, intervention_id);

      res.status(200).json({ status: 'On Track' });
    } catch (error: any) {
      console.error('Error in markComplete:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
}

