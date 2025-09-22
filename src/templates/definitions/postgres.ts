import type { ContainerTemplate } from '../../types/registry.js';

export const postgresTemplate: ContainerTemplate = {
  name: 'postgres',
  description: 'PostgreSQL relational database',
  image: 'postgres:15-alpine',
  defaultPorts: ['5432:5432'],
  requiredEnv: ['POSTGRES_PASSWORD'],
  optionalEnv: {
    POSTGRES_USER: 'postgres',
    POSTGRES_DB: 'postgres',
    POSTGRES_INITDB_ARGS: '--auth-host=scram-sha-256',
  },
  volumes: [
    'postgres_data:/var/lib/postgresql/data'
  ],
  healthCheck: 'pg_isready -U $POSTGRES_USER',
  documentation: `
PostgreSQL Configuration:
- Default port: 5432
- Required: POSTGRES_PASSWORD
- Optional: POSTGRES_USER (default: postgres)
- Optional: POSTGRES_DB (default: postgres)
- Data persistence: /var/lib/postgresql/data

Connection:
  psql -h localhost -p 5432 -U postgres -d postgres
  `
};