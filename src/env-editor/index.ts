import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { watch, FSWatcher } from 'chokidar';
import * as dotenv from 'dotenv';

export interface EnvVariable {
  key: string;
  value: string;
  comment?: string | undefined;
}

export class EnvironmentEditor {
  private watchers: Map<string, FSWatcher> = new Map();
  private envCache: Map<string, EnvVariable[]> = new Map();
  private listeners: Map<string, Set<(variables: EnvVariable[]) => void>> = new Map();

  constructor() {}

  async readEnvFile(filePath: string): Promise<EnvVariable[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const variables = this.parseEnvContent(content);
      this.envCache.set(filePath, variables);
      return variables;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist, return empty array
        return [];
      }
      throw error;
    }
  }

  private parseEnvContent(content: string): EnvVariable[] {
    const lines = content.split('\n');
    const variables: EnvVariable[] = [];
    let currentComment: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();

      // Handle comments
      if (trimmed.startsWith('#')) {
        currentComment = trimmed.substring(1).trim();
        continue;
      }

      // Handle empty lines
      if (!trimmed) {
        currentComment = undefined;
        continue;
      }

      // Handle key=value pairs
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        let value = trimmed.substring(equalIndex + 1).trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        variables.push({
          key,
          value,
          comment: currentComment,
        });

        currentComment = undefined;
      }
    }

    return variables;
  }

  async writeEnvFile(filePath: string, variables: EnvVariable[]): Promise<void> {
    const content = this.formatEnvContent(variables);

    // Ensure directory exists
    await fs.mkdir(dirname(filePath), { recursive: true });

    await fs.writeFile(filePath, content, 'utf-8');
    this.envCache.set(filePath, [...variables]);

    // Notify listeners
    this.notifyListeners(filePath, variables);
  }

  private formatEnvContent(variables: EnvVariable[]): string {
    const lines: string[] = [];

    for (const variable of variables) {
      if (variable.comment) {
        lines.push(`# ${variable.comment}`);
      }

      let value = variable.value;

      // Quote value if it contains spaces or special characters
      if (value.includes(' ') || value.includes('#') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '\\"')}"`;
      }

      lines.push(`${variable.key}=${value}`);
    }

    return lines.join('\n') + '\n';
  }

  async updateVariable(filePath: string, key: string, value: string, comment?: string): Promise<void> {
    const variables = await this.readEnvFile(filePath);
    const existingIndex = variables.findIndex(v => v.key === key);

    if (existingIndex >= 0) {
      variables[existingIndex] = { key, value, comment };
    } else {
      variables.push({ key, value, comment });
    }

    await this.writeEnvFile(filePath, variables);
  }

  async removeVariable(filePath: string, key: string): Promise<void> {
    const variables = await this.readEnvFile(filePath);
    const filteredVariables = variables.filter(v => v.key !== key);
    await this.writeEnvFile(filePath, filteredVariables);
  }

  async validateEnvFile(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const variables = await this.readEnvFile(filePath);
      const errors: string[] = [];

      // Check for duplicate keys
      const keys = new Set<string>();
      for (const variable of variables) {
        if (keys.has(variable.key)) {
          errors.push(`Duplicate key: ${variable.key}`);
        }
        keys.add(variable.key);
      }

      // Check for empty keys
      for (const variable of variables) {
        if (!variable.key.trim()) {
          errors.push('Empty key found');
        }
      }

      // Check for invalid key names (should start with letter or underscore)
      for (const variable of variables) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.key)) {
          errors.push(`Invalid key name: ${variable.key}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Failed to read file: ${(error as Error).message}`],
      };
    }
  }

  watchEnvFile(filePath: string, callback: (variables: EnvVariable[]) => void): () => void {
    // Add listener
    if (!this.listeners.has(filePath)) {
      this.listeners.set(filePath, new Set());
    }
    this.listeners.get(filePath)!.add(callback);

    // Set up file watcher if not already watching
    if (!this.watchers.has(filePath)) {
      const watcher = watch(filePath, {
        persistent: false,
        ignoreInitial: true,
      });

      watcher.on('change', async () => {
        try {
          const variables = await this.readEnvFile(filePath);
          this.notifyListeners(filePath, variables);
        } catch (error) {
          console.error(`Error reading env file ${filePath}:`, error);
        }
      });

      this.watchers.set(filePath, watcher);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(filePath);
      if (listeners) {
        listeners.delete(callback);

        // If no more listeners, stop watching
        if (listeners.size === 0) {
          const watcher = this.watchers.get(filePath);
          if (watcher) {
            watcher.close();
            this.watchers.delete(filePath);
          }
          this.listeners.delete(filePath);
        }
      }
    };
  }

  private notifyListeners(filePath: string, variables: EnvVariable[]): void {
    const listeners = this.listeners.get(filePath);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(variables);
        } catch (error) {
          console.error('Error in env file listener:', error);
        }
      });
    }
  }

  async loadEnvFromDotenv(filePath: string): Promise<Record<string, string>> {
    try {
      const result = dotenv.config({ path: filePath });
      return result.parsed || {};
    } catch (error) {
      console.error(`Error loading .env file ${filePath}:`, error);
      return {};
    }
  }

  getServiceEnvFiles(serviceDirectory: string): string[] {
    const commonEnvFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.test',
    ];

    return commonEnvFiles.map(filename => join(serviceDirectory, filename));
  }

  async findEnvFiles(directory: string): Promise<string[]> {
    try {
      const files = await fs.readdir(directory);
      const envFiles = files.filter(file =>
        file.startsWith('.env') || file.endsWith('.env')
      );
      return envFiles.map(file => join(directory, file));
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
      return [];
    }
  }

  dispose(): void {
    // Close all watchers
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
    this.listeners.clear();
    this.envCache.clear();
  }
}

export const envEditor = new EnvironmentEditor();