import { Student, DailyLog, Intervention, MentorAction } from '../types';

export interface IStudentRepo {
  getById(id: string): Promise<Student | null>;
  updateStatus(id: string, status: Student['status']): Promise<void>;
  updateLastIntervention(id: string, interventionId: string): Promise<void>;
}

export interface IDailyLogRepo {
  create(log: Omit<DailyLog, 'id' | 'created_at'>): Promise<DailyLog>;
  getRecentByStudentId(studentId: string, limit?: number): Promise<DailyLog[]>;
}

export interface IInterventionRepo {
  create(intervention: Omit<Intervention, 'id' | 'assigned_at' | 'completed_at'>): Promise<Intervention>;
  getById(id: string): Promise<Intervention | null>;
  getActiveByStudentId(studentId: string): Promise<Intervention | null>;
  markComplete(id: string): Promise<void>;
  updateStatus(id: string, status: Intervention['status']): Promise<void>;
}

export interface IMentorActionRepo {
  create(action: Omit<MentorAction, 'id' | 'created_at'>): Promise<MentorAction>;
}

