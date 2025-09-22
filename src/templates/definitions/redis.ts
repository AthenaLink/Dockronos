import type { ContainerTemplate } from '../../types/registry.js';

export const redisTemplate: ContainerTemplate = {
  name: 'redis',
  description: 'Redis in-memory data structure store',
  image: 'redis:alpine',
  defaultPorts: ['6379:6379'],
  optionalEnv: {
    REDIS_PASSWORD: '',
    REDIS_DATABASES: '16',
  },
  volumes: [
    'redis_data:/data'
  ],
  healthCheck: 'redis-cli ping',
  documentation: `
Redis Configuration:
- Default port: 6379
- Data persistence: /data volume
- Password protection: Set REDIS_PASSWORD
- Database count: Set REDIS_DATABASES (default: 16)

Usage:
  redis-cli -h localhost -p 6379
  `
};