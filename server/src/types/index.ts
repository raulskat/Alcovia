export type StudentStatus = 'On Track' | 'Needs Intervention' | 'Remedial' | 'Locked';
export type InterventionStatus = 'assigned' | 'completed' | 'cancelled';

export interface Student {
  id: string;
  name: string;
  email?: string;
  status: StudentStatus;
  last_intervention_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DailyLog {
  id: string;
  student_id: string;
  quiz_score: number;
  focus_minutes: number;
  created_at: Date;
}

export interface Intervention {
  id: string;
  student_id: string;
  assigned_by?: string;
  task: string;
  status: InterventionStatus;
  assigned_at: Date;
  completed_at?: Date;
  mentor_deadline?: Date;
}

export interface MentorAction {
  id: string;
  intervention_id?: string;
  mentor?: string;
  action: string;
  payload?: any;
  created_at: Date;
}

export interface DailyCheckinPayload {
  student_id: string;
  quiz_score: number;
  focus_minutes: number;
}

export interface AssignInterventionPayload {
  student_id: string;
  intervention_task: string;
  mentor: string;
}

export interface StudentStateResponse {
  student_id: string;
  status: StudentStatus;
  active_intervention?: {
    id: string;
    task: string;
    status: InterventionStatus;
  };
}

export interface CheckinResponse {
  status: StudentStatus | 'Pending Mentor Review';
  intervention_id?: string;
}

