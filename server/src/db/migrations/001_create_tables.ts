import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create students table
  await knex.schema.createTable('students', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('name').notNullable();
    table.text('email');
    table.text('status').notNullable().defaultTo('On Track'); // On Track | Needs Intervention | Remedial | Locked
    table.uuid('last_intervention_id').nullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Create daily_logs table
  await knex.schema.createTable('daily_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('student_id').notNullable().references('id').inTable('students').onDelete('CASCADE');
    table.integer('quiz_score').notNullable();
    table.integer('focus_minutes').notNullable();
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Create interventions table
  await knex.schema.createTable('interventions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('student_id').notNullable().references('id').inTable('students');
    table.text('assigned_by'); // mentor id or system
    table.text('task').notNullable();
    table.text('status').notNullable().defaultTo('assigned'); // assigned | completed | cancelled
    table.timestamp('assigned_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('completed_at', { useTz: true }).nullable();
    table.timestamp('mentor_deadline', { useTz: true }).nullable(); // for fail-safe escalation
  });

  // Create mentor_actions table
  await knex.schema.createTable('mentor_actions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('intervention_id').references('id').inTable('interventions');
    table.text('mentor');
    table.text('action');
    table.jsonb('payload');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
  });

  // Create indexes
  await knex.schema.raw(`
    CREATE INDEX idx_daily_logs_student_created ON daily_logs (student_id, created_at DESC);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('mentor_actions');
  await knex.schema.dropTableIfExists('interventions');
  await knex.schema.dropTableIfExists('daily_logs');
  await knex.schema.dropTableIfExists('students');
}

