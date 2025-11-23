// Type declaration for knexfile.js
declare module '../../knexfile' {
  import { Knex } from 'knex';
  const config: {
    development: Knex.Config;
    production: Knex.Config;
  };
  export default config;
}

