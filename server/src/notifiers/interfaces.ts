export interface INotifier {
  notifyMentor(payload: MentorNotificationPayload): Promise<void>;
}

export interface MentorNotificationPayload {
  student_id: string;
  name?: string;
  email?: string;
  quiz_score: number;
  focus_minutes: number;
  daily_log_id?: string;
  timestamp?: string;
}

