import knex, { Knex } from 'knex';
// @ts-ignore - knexfile.cjs is a CommonJS module, not TypeScript
const config = require('../../knexfile.cjs');

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment as keyof typeof config];

export const db: Knex = knex(dbConfig);

export default db;

