import type { ContainerTemplate } from '../../types/registry.js';

export const mongoTemplate: ContainerTemplate = {
  name: 'mongo',
  description: 'MongoDB document database',
  image: 'mongo:latest',
  defaultPorts: ['27017:27017'],
  optionalEnv: {
    MONGO_INITDB_ROOT_USERNAME: 'admin',
    MONGO_INITDB_ROOT_PASSWORD: '',
    MONGO_INITDB_DATABASE: 'admin',
  },
  volumes: [
    'mongo_data:/data/db',
    'mongo_config:/data/configdb'
  ],
  healthCheck: 'mongosh --eval "db.adminCommand(\'ping\')"',
  documentation: `
MongoDB Configuration:
- Default port: 27017
- Optional: MONGO_INITDB_ROOT_USERNAME (default: admin)
- Optional: MONGO_INITDB_ROOT_PASSWORD (for auth)
- Optional: MONGO_INITDB_DATABASE (default: admin)
- Data persistence: /data/db, /data/configdb

Connection:
  mongosh mongodb://localhost:27017
  mongosh mongodb://admin:password@localhost:27017 (with auth)
  `
};