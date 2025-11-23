import { db } from '../db/connection';
import { Intervention } from '../types';
import { IInterventionRepo } from './interfaces';

export class InterventionRepo implements IInterventionRepo {
  async create(intervention: Omit<Intervention, 'id' | 'assigned_at' | 'completed_at'>): Promise<Intervention> {
    const [created] = await db('interventions')
      .insert(intervention)
      .returning('*');
    return created;
  }

  async getById(id: string): Promise<Intervention | null> {
    const intervention = await db('interventions').where({ id }).first();
    return intervention || null;
  }

  async getActiveByStudentId(studentId: string): Promise<Intervention | null> {
    const intervention = await db('interventions')
      .where({ student_id: studentId, status: 'assigned' })
      .orderBy('assigned_at', 'desc')
      .first();
    return intervention || null;
  }

  async markComplete(id: string): Promise<void> {
    await db('interventions')
      .where({ id })
      .update({ status: 'completed', completed_at: db.fn.now() });
  }

  async updateStatus(id: string, status: Intervention['status']): Promise<void> {
    await db('interventions')
      .where({ id })
      .update({ status });
  }
}

