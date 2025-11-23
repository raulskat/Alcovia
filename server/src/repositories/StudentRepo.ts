import { db } from '../db/connection';
import { Student } from '../types';
import { IStudentRepo } from './interfaces';

export class StudentRepo implements IStudentRepo {
  async getById(id: string): Promise<Student | null> {
    const student = await db('students').where({ id }).first();
    return student || null;
  }

  async updateStatus(id: string, status: Student['status']): Promise<void> {
    await db('students')
      .where({ id })
      .update({ status, updated_at: db.fn.now() });
  }

  async updateLastIntervention(id: string, interventionId: string): Promise<void> {
    await db('students')
      .where({ id })
      .update({ last_intervention_id: interventionId, updated_at: db.fn.now() });
  }
}

