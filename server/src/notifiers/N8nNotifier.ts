import axios from 'axios';
import { INotifier, MentorNotificationPayload } from './interfaces';
import { config } from '../config';

export class N8nNotifier implements INotifier {
  private webhookUrl: string;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || config.n8n.WEBHOOK_URL;
  }

  async notifyMentor(payload: MentorNotificationPayload): Promise<void> {
    if (!this.webhookUrl) {
      throw new Error('N8N_WEBHOOK_URL not configured');
    }

    try {
      await axios.post(this.webhookUrl, {
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to notify mentor via n8n:', error);
      throw error;
    }
  }
}

