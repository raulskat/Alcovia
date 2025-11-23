import { db } from '../db/connection';
import { InterventionService } from '../services/InterventionService';
import { StudentRepo } from '../repositories/StudentRepo';
import { InterventionRepo } from '../repositories/InterventionRepo';
import { DailyLogRepo } from '../repositories/DailyLogRepo';
import { EmailNotifier } from '../notifiers/EmailNotifier';
import { config } from '../config';

/**
 * Fail-Safe Escalation Worker
 * Checks for overdue interventions and auto-escalates or auto-unlocks
 */
export class EscalationWorker {
  private interventionService: InterventionService;

  constructor() {
    // Initialize with EmailNotifier for escalations (could be different from n8n)
    const studentRepo = new StudentRepo();
    const interventionRepo = new InterventionRepo();
    const logRepo = new DailyLogRepo();
    const notifier = new EmailNotifier();

    this.interventionService = new InterventionService(
      studentRepo,
      logRepo,
      interventionRepo,
      notifier
    );
  }

  /**
   * Check for overdue interventions and handle escalation
   */
  async checkOverdueInterventions(): Promise<void> {
    try {
      // Check if tables exist first (migrations might not have run yet)
      const hasInterventionsTable = await db.schema.hasTable('interventions');
      if (!hasInterventionsTable) {
        console.log('⚠️  Interventions table does not exist yet. Run migrations first.');
        return;
      }

      const now = new Date();
      const deadlineThreshold = new Date(now.getTime() - config.failSafe.MENTOR_RESPONSE_DEADLINE_HOURS * 60 * 60 * 1000);
      const autoUnlockThreshold = new Date(now.getTime() - config.failSafe.AUTO_UNLOCK_HOURS * 60 * 60 * 1000);

      // Find interventions past deadline that are still assigned
      const overdueInterventions = await db('interventions')
        .where('status', 'assigned')
        .whereNotNull('mentor_deadline')
        .where('mentor_deadline', '<', deadlineThreshold)
        .select('*');

      console.log(`Found ${overdueInterventions.length} overdue interventions`);

      for (const intervention of overdueInterventions) {
        // Check if past auto-unlock threshold
        const interventionCreated = new Date(intervention.assigned_at);
        
        if (interventionCreated < autoUnlockThreshold) {
          // Auto-unlock: assign default task and set to Remedial
          console.log(`Auto-unlocking intervention ${intervention.id} for student ${intervention.student_id}`);
          
          await this.interventionService.assignIntervention({
            student_id: intervention.student_id,
            intervention_task: 'Auto-assigned: Watch Lecture 3',
            mentor: 'system-auto',
          });

          // Log escalation
          await db('mentor_actions').insert({
            intervention_id: intervention.id,
            mentor: 'system-auto',
            action: 'auto_unlock',
            payload: { reason: 'No mentor response within auto-unlock window' },
          });
        } else {
          // Escalate to head mentor (send notification)
          console.log(`Escalating intervention ${intervention.id} for student ${intervention.student_id}`);
          
          // In production, send to head mentor
          await db('mentor_actions').insert({
            intervention_id: intervention.id,
            mentor: 'head-mentor',
            action: 'escalate',
            payload: { reason: 'Mentor deadline exceeded', deadline: intervention.mentor_deadline },
          });

          // Could trigger another notification here
        }
      }
    } catch (error) {
      console.error('Error in escalation worker:', error);
    }
  }

  /**
   * Start the worker (runs every 10 minutes)
   */
  start(): void {
    console.log('Starting escalation worker...');
    
    // Run immediately
    this.checkOverdueInterventions();

    // Then run every 10 minutes
    setInterval(() => {
      this.checkOverdueInterventions();
    }, 10 * 60 * 1000); // 10 minutes
  }
}

