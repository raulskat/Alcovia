/**
 * Utility functions for creating test data
 * Useful for development and testing
 */

import { db } from '../db/connection';
import { v4 as uuidv4 } from 'uuid';

export async function createTestStudent(id?: string, name: string = 'Test Student') {
  // Use provided ID or generate a UUID
  // For demo purposes, use a consistent test UUID if not provided
  const studentId = id || '11111111-2222-3333-4444-555555555555';
  
  await db('students').insert({
    id: studentId,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    status: 'On Track',
  }).onConflict('id').merge();
  
  console.log(`✅ Created test student: ${name} (${studentId})`);
  return studentId;
}

export async function clearTestData() {
  await db('mentor_actions').del();
  await db('interventions').del();
  await db('daily_logs').del();
  await db('students').del();
  console.log('✅ Cleared all test data');
}

