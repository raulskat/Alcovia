import { db } from '../db/connection';
import { MentorAction } from '../types';
import { IMentorActionRepo } from './interfaces';

export class MentorActionRepo implements IMentorActionRepo {
  async create(action: Omit<MentorAction, 'id' | 'created_at'>): Promise<MentorAction> {
    const [created] = await db('mentor_actions')
      .insert(action)
      .returning('*');
    return created;
  }
}

