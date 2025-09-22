import type { ContainerTemplate } from '../types/registry.js';
import { redisTemplate } from './definitions/redis.js';
import { postgresTemplate } from './definitions/postgres.js';
import { mongoTemplate } from './definitions/mongo.js';
import { nginxTemplate } from './definitions/nginx.js';
import { mysqlTemplate } from './definitions/mysql.js';

export class TemplateManager {
  private templates: Map<string, ContainerTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  private loadDefaultTemplates(): void {
    const defaultTemplates = [
      redisTemplate,
      postgresTemplate,
      mongoTemplate,
      nginxTemplate,
      mysqlTemplate,
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.name, template);
    }
  }

  getTemplate(name: string): ContainerTemplate | undefined {
    return this.templates.get(name.toLowerCase());
  }

  listTemplates(): ContainerTemplate[] {
    return Array.from(this.templates.values());
  }

  addTemplate(template: ContainerTemplate): void {
    this.templates.set(template.name.toLowerCase(), template);
  }

  removeTemplate(name: string): boolean {
    return this.templates.delete(name.toLowerCase());
  }

  hasTemplate(name: string): boolean {
    return this.templates.has(name.toLowerCase());
  }

  searchTemplates(query: string): ContainerTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.listTemplates().filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery)
    );
  }

  getTemplatesByCategory(): Record<string, ContainerTemplate[]> {
    const categories: Record<string, ContainerTemplate[]> = {
      'Databases': [],
      'Web Servers': [],
      'Caching': [],
      'Other': []
    };

    for (const template of this.listTemplates()) {
      if (['postgres', 'mysql', 'mongo'].includes(template.name)) {
        categories['Databases']?.push(template);
      } else if (['nginx', 'apache'].includes(template.name)) {
        categories['Web Servers']?.push(template);
      } else if (['redis', 'memcached'].includes(template.name)) {
        categories['Caching']?.push(template);
      } else {
        categories['Other']?.push(template);
      }
    }

    return categories;
  }

  validateTemplate(template: ContainerTemplate): string[] {
    const errors: string[] = [];

    if (!template.name || template.name.trim() === '') {
      errors.push('Template name is required');
    }

    if (!template.description || template.description.trim() === '') {
      errors.push('Template description is required');
    }

    if (!template.image || template.image.trim() === '') {
      errors.push('Template image is required');
    }

    // Validate port format
    if (template.defaultPorts) {
      for (const port of template.defaultPorts) {
        if (!/^\d+:\d+$/.test(port)) {
          errors.push(`Invalid port format: ${port}. Expected format: "host:container"`);
        }
      }
    }

    // Validate volume format
    if (template.volumes) {
      for (const volume of template.volumes) {
        if (!volume.includes(':')) {
          errors.push(`Invalid volume format: ${volume}. Expected format: "host:container" or "volume:container"`);
        }
      }
    }

    return errors;
  }

  exportTemplate(name: string): string | null {
    const template = this.getTemplate(name);
    if (!template) {
      return null;
    }

    return JSON.stringify(template, null, 2);
  }

  importTemplate(templateJson: string): { success: boolean; error?: string; template?: ContainerTemplate } {
    try {
      const template = JSON.parse(templateJson) as ContainerTemplate;
      const errors = this.validateTemplate(template);

      if (errors.length > 0) {
        return {
          success: false,
          error: `Template validation failed: ${errors.join(', ')}`
        };
      }

      this.addTemplate(template);
      return {
        success: true,
        template
      };
    } catch (error) {
      return {
        success: false,
        error: `Invalid JSON: ${(error as Error).message}`
      };
    }
  }
}

export const templateManager = new TemplateManager();