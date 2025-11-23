import { INotifier, MentorNotificationPayload } from './interfaces';

/**
 * EmailNotifier - For development/testing purposes
 * In production, use N8nNotifier which triggers email via n8n
 */
export class EmailNotifier implements INotifier {
  async notifyMentor(payload: MentorNotificationPayload): Promise<void> {
    // In development, just log
    console.log('📧 Email Notification (DEV MODE):', {
      to: 'mentor@org.com',
      subject: `Student Needs Intervention: ${payload.name || payload.student_id}`,
      body: `Student ${payload.name || payload.student_id} needs intervention.
Quiz Score: ${payload.quiz_score}
Focus Minutes: ${payload.focus_minutes}`,
    });
  }
}

