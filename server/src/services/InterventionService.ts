import { IStudentRepo } from '../repositories/interfaces';
import { IDailyLogRepo } from '../repositories/interfaces';
import { IInterventionRepo } from '../repositories/interfaces';
import { INotifier } from '../notifiers/interfaces';
import { DailyCheckinPayload, CheckinResponse, AssignInterventionPayload } from '../types';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export class InterventionService {
  constructor(
    private studentRepo: IStudentRepo,
    private logRepo: IDailyLogRepo,
    private interventionRepo: IInterventionRepo,
    private notifier: INotifier
  ) {}

  /**
   * Logic Gate: Determines if student passes or needs intervention
   * Quiz > 7 AND Focus > 60 minutes = Pass
   * Otherwise = Needs Intervention
   */
  private shouldPass(quizScore: number, focusMinutes: number): boolean {
    return quizScore > config.thresholds.QUIZ_PASS_SCORE && 
           focusMinutes > config.thresholds.FOCUS_MIN_MINUTES;
  }

  /**
   * Handle daily checkin - implements the main logic gate
   */
  async handleDailyCheckin(payload: DailyCheckinPayload): Promise<CheckinResponse> {
    // Verify student exists
    const student = await this.studentRepo.getById(payload.student_id);
    if (!student) {
      throw new Error(`Student ${payload.student_id} not found`);
    }

    // Insert daily log
    const log = await this.logRepo.create({
      student_id: payload.student_id,
      quiz_score: payload.quiz_score,
      focus_minutes: payload.focus_minutes,
    });

    // Run logic gate
    const shouldPass = this.shouldPass(payload.quiz_score, payload.focus_minutes);

    if (shouldPass) {
      // Student passes - ensure status is On Track
      if (student.status !== 'On Track') {
        await this.studentRepo.updateStatus(payload.student_id, 'On Track');
      }
      return { status: 'On Track' };
    } else {
      // Student fails - needs intervention
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + config.failSafe.MENTOR_RESPONSE_DEADLINE_HOURS);

      // Create pending intervention
      const intervention = await this.interventionRepo.create({
        student_id: payload.student_id,
        assigned_by: 'system',
        task: 'Pending mentor assignment',
        status: 'assigned',
        mentor_deadline: deadline,
      });

      // Update student status to Locked (or Needs Intervention)
      await this.studentRepo.updateStatus(payload.student_id, 'Locked');
      await this.studentRepo.updateLastIntervention(payload.student_id, intervention.id);

      // Notify mentor via n8n
      try {
        await this.notifier.notifyMentor({
          student_id: payload.student_id,
          name: student.name,
          email: student.email,
          quiz_score: payload.quiz_score,
          focus_minutes: payload.focus_minutes,
          daily_log_id: log.id,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to notify mentor, but intervention created:', error);
        // Don't fail the request if notification fails
      }

      return {
        status: 'Pending Mentor Review',
        intervention_id: intervention.id,
      };
    }
  }

  /**
   * Assign intervention task from mentor
   */
  async assignIntervention(payload: AssignInterventionPayload): Promise<void> {
    // Verify student exists
    const student = await this.studentRepo.getById(payload.student_id);
    if (!student) {
      throw new Error(`Student ${payload.student_id} not found`);
    }

    // Get or create intervention
    let intervention = await this.interventionRepo.getActiveByStudentId(payload.student_id);
    
    if (intervention) {
      // Update existing intervention
      await this.interventionRepo.updateStatus(intervention.id, 'assigned');
      // Note: In a full implementation, you'd update the task as well
    } else {
      // Create new intervention
      intervention = await this.interventionRepo.create({
        student_id: payload.student_id,
        assigned_by: payload.mentor,
        task: payload.intervention_task,
        status: 'assigned',
      });
    }

    // Update student status to Remedial
    await this.studentRepo.updateStatus(payload.student_id, 'Remedial');
    await this.studentRepo.updateLastIntervention(payload.student_id, intervention.id);
  }

  /**
   * Mark intervention as complete and restore student to On Track
   */
  async markInterventionComplete(studentId: string, interventionId: string): Promise<void> {
    // Verify student exists
    const student = await this.studentRepo.getById(studentId);
    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    // Verify intervention exists and belongs to student
    const intervention = await this.interventionRepo.getById(interventionId);
    if (!intervention || intervention.student_id !== studentId) {
      throw new Error(`Intervention ${interventionId} not found or doesn't belong to student`);
    }

    // Mark intervention complete
    await this.interventionRepo.markComplete(interventionId);

    // Restore student to On Track
    await this.studentRepo.updateStatus(studentId, 'On Track');
  }
}

