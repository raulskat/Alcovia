#!/usr/bin/env ts-node

/**
 * Script to create a test student in the database
 * Usage: ts-node src/scripts/create-test-student.ts
 */

import dotenv from 'dotenv';
import { createTestStudent } from '../utils/test-data';

dotenv.config();

async function main() {
  // Default to a valid UUID for demo purposes
  const studentId = process.argv[2] || '11111111-2222-3333-4444-555555555555';
  const studentName = process.argv[3] || 'Test Student';

  try {
    await createTestStudent(studentId, studentName);
    console.log(`\n✅ Test student created successfully!`);
    console.log(`   Student ID: ${studentId}`);
    console.log(`   Name: ${studentName}`);
    console.log(`\nYou can now use this student ID in the frontend app.\n`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error creating test student:', error.message);
    process.exit(1);
  }
}

main();

