import type { ContainerTemplate } from '../../types/registry.js';

export const mysqlTemplate: ContainerTemplate = {
  name: 'mysql',
  description: 'MySQL relational database',
  image: 'mysql:8.0',
  defaultPorts: ['3306:3306'],
  requiredEnv: ['MYSQL_ROOT_PASSWORD'],
  optionalEnv: {
    MYSQL_DATABASE: '',
    MYSQL_USER: '',
    MYSQL_PASSWORD: '',
    MYSQL_RANDOM_ROOT_PASSWORD: 'false',
  },
  volumes: [
    'mysql_data:/var/lib/mysql'
  ],
  healthCheck: 'mysqladmin ping -h localhost',
  documentation: `
MySQL Configuration:
- Default port: 3306
- Required: MYSQL_ROOT_PASSWORD
- Optional: MYSQL_DATABASE (creates database)
- Optional: MYSQL_USER, MYSQL_PASSWORD (creates user)
- Data persistence: /var/lib/mysql

Connection:
  mysql -h localhost -P 3306 -u root -p
  mysql -h localhost -P 3306 -u $MYSQL_USER -p $MYSQL_DATABASE
  `
};