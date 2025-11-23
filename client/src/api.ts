import axios from 'axios';
import { config } from './config';

const api = axios.create({
  baseURL: `${config.apiUrl}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DailyCheckinPayload {
  student_id: string;
  quiz_score: number;
  focus_minutes: number;
}

export interface CheckinResponse {
  status: string;
  intervention_id?: string;
}

export interface StudentState {
  student_id: string;
  status: 'On Track' | 'Needs Intervention' | 'Remedial' | 'Locked';
  active_intervention?: {
    id: string;
    task: string;
    status: string;
  };
}

export interface MarkCompletePayload {
  student_id: string;
  intervention_id: string;
}

export const apiClient = {
  dailyCheckin: async (payload: DailyCheckinPayload): Promise<CheckinResponse> => {
    const response = await api.post('/daily-checkin', payload);
    return response.data;
  },

  getStudentState: async (studentId: string): Promise<StudentState> => {
    const response = await api.get(`/student/${studentId}/state`);
    return response.data;
  },

  markComplete: async (payload: MarkCompletePayload): Promise<{ status: string }> => {
    const response = await api.post('/mark-complete', payload);
    return response.data;
  },
};

