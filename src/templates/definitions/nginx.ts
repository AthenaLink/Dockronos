import type { ContainerTemplate } from '../../types/registry.js';

export const nginxTemplate: ContainerTemplate = {
  name: 'nginx',
  description: 'Nginx web server and reverse proxy',
  image: 'nginx:alpine',
  defaultPorts: ['80:80', '443:443'],
  volumes: [
    './nginx.conf:/etc/nginx/nginx.conf:ro',
    './html:/usr/share/nginx/html:ro',
    './ssl:/etc/nginx/ssl:ro'
  ],
  healthCheck: 'curl -f http://localhost/ || exit 1',
  documentation: `
Nginx Configuration:
- Default ports: 80 (HTTP), 443 (HTTPS)
- Config: Mount ./nginx.conf to /etc/nginx/nginx.conf
- Web root: Mount ./html to /usr/share/nginx/html
- SSL certificates: Mount ./ssl to /etc/nginx/ssl

Example nginx.conf:
  events { worker_connections 1024; }
  http {
    server {
      listen 80;
      location / {
        root /usr/share/nginx/html;
        index index.html;
      }
    }
  }
  `
};