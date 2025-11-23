import { db } from '../db/connection';
import { DailyLog } from '../types';
import { IDailyLogRepo } from './interfaces';

export class DailyLogRepo implements IDailyLogRepo {
  async create(log: Omit<DailyLog, 'id' | 'created_at'>): Promise<DailyLog> {
    const [created] = await db('daily_logs')
      .insert(log)
      .returning('*');
    return created;
  }

  async getRecentByStudentId(studentId: string, limit: number = 5): Promise<DailyLog[]> {
    return await db('daily_logs')
      .where({ student_id: studentId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }
}
