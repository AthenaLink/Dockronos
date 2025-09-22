import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import type { GitCloneOptions, GitStatus, GitUpdateResult } from '../types/git.js';
import type { GitRepository } from '../types/index.js';

const execAsync = promisify(exec);

export class GitManager {
  private projectsDirectory: string;

  constructor(projectsDirectory = './projects') {
    this.projectsDirectory = projectsDirectory;
  }

  async ensureProjectsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.projectsDirectory, { recursive: true });
    } catch (error) {
      console.error('Failed to create projects directory:', error);
    }
  }

  async cloneRepository(options: GitCloneOptions): Promise<void> {
    await this.ensureProjectsDirectory();

    const targetPath = join(this.projectsDirectory, options.directory);

    // Check if directory already exists
    try {
      await fs.access(targetPath);
      throw new Error(`Directory ${targetPath} already exists`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    const args = ['clone'];

    if (options.branch) {
      args.push('-b', options.branch);
    }

    if (options.depth) {
      args.push('--depth', options.depth.toString());
    }

    if (options.recursive) {
      args.push('--recursive');
    }

    args.push(options.url, targetPath);

    return new Promise((resolve, reject) => {
      const gitProcess = spawn('git', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      gitProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(data.toString().trim());
      });

      gitProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log(data.toString().trim());
      });

      gitProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Git clone failed: ${stderr || stdout}`));
        }
      });

      gitProcess.on('error', reject);
    });
  }

  async updateRepository(repositoryPath: string): Promise<GitUpdateResult> {
    const fullPath = join(this.projectsDirectory, repositoryPath);
    const repoName = repositoryPath;

    try {
      // Check if it's a git repository
      await fs.access(join(fullPath, '.git'));

      // Get current status before update
      const statusBefore = await this.getRepositoryStatus(repositoryPath);

      // Fetch latest changes
      await execAsync('git fetch origin', { cwd: fullPath });

      // Get the number of commits behind
      const { stdout: behindCount } = await execAsync(
        `git rev-list HEAD..origin/${statusBefore.branch} --count`,
        { cwd: fullPath }
      );

      const commitsToUpdate = parseInt(behindCount.trim());

      if (commitsToUpdate === 0) {
        return {
          repository: repoName,
          success: true,
          changes: 0,
          newCommits: []
        };
      }

      // Get the commit messages that will be pulled
      const { stdout: commitMessages } = await execAsync(
        `git log HEAD..origin/${statusBefore.branch} --oneline`,
        { cwd: fullPath }
      );

      const newCommits = commitMessages.trim().split('\n').filter(Boolean);

      // Pull the changes
      await execAsync('git pull origin', { cwd: fullPath });

      return {
        repository: repoName,
        success: true,
        changes: commitsToUpdate,
        newCommits
      };

    } catch (error) {
      return {
        repository: repoName,
        success: false,
        changes: 0,
        error: (error as Error).message
      };
    }
  }

  async getRepositoryStatus(repositoryPath: string): Promise<GitStatus> {
    const fullPath = join(this.projectsDirectory, repositoryPath);

    try {
      // Get current branch
      const { stdout: branchOutput } = await execAsync('git branch --show-current', { cwd: fullPath });
      const branch = branchOutput.trim();

      // Get commits ahead/behind
      let ahead = 0;
      let behind = 0;

      try {
        const { stdout: aheadBehind } = await execAsync(
          `git rev-list --count --left-right HEAD...origin/${branch}`,
          { cwd: fullPath }
        );
        const [aheadStr, behindStr] = aheadBehind.trim().split('\t');
        ahead = parseInt(aheadStr) || 0;
        behind = parseInt(behindStr) || 0;
      } catch {
        // Ignore errors (might not have remote tracking)
      }

      // Get working directory status
      const { stdout: statusOutput } = await execAsync('git status --porcelain', { cwd: fullPath });
      const statusLines = statusOutput.trim().split('\n').filter(Boolean);

      let modified = 0;
      let staged = 0;
      let untracked = 0;

      for (const line of statusLines) {
        const status = line.substring(0, 2);
        if (status[0] !== ' ' && status[0] !== '?') {
          staged++;
        }
        if (status[1] !== ' ') {
          modified++;
        }
        if (status === '??') {
          untracked++;
        }
      }

      // Get last commit date
      const { stdout: lastCommitDate } = await execAsync('git log -1 --format=%ci', { cwd: fullPath });
      const lastUpdate = new Date(lastCommitDate.trim());

      return {
        repository: repositoryPath,
        branch,
        ahead,
        behind,
        modified,
        staged,
        untracked,
        lastUpdate
      };

    } catch (error) {
      throw new Error(`Failed to get repository status: ${(error as Error).message}`);
    }
  }

  async listRepositories(): Promise<GitStatus[]> {
    await this.ensureProjectsDirectory();

    try {
      const entries = await fs.readdir(this.projectsDirectory, { withFileTypes: true });
      const repositories: GitStatus[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          try {
            const status = await this.getRepositoryStatus(entry.name);
            repositories.push(status);
          } catch {
            // Skip directories that are not git repositories
          }
        }
      }

      return repositories;
    } catch (error) {
      console.error('Failed to list repositories:', error);
      return [];
    }
  }

  async updateAllRepositories(): Promise<GitUpdateResult[]> {
    const repositories = await this.listRepositories();
    const results: GitUpdateResult[] = [];

    for (const repo of repositories) {
      const result = await this.updateRepository(repo.repository);
      results.push(result);
    }

    return results;
  }

  async removeRepository(repositoryPath: string, force = false): Promise<void> {
    const fullPath = join(this.projectsDirectory, repositoryPath);

    try {
      await fs.access(fullPath);

      if (!force) {
        // Check if there are uncommitted changes
        const status = await this.getRepositoryStatus(repositoryPath);
        if (status.modified > 0 || status.staged > 0 || status.untracked > 0) {
          throw new Error(`Repository has uncommitted changes. Use --force to remove anyway.`);
        }
      }

      // Remove the directory
      await fs.rm(fullPath, { recursive: true, force: true });

    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`Repository ${repositoryPath} does not exist`);
      }
      throw error;
    }
  }

  async discoverComposeFiles(repositoryPath: string): Promise<string[]> {
    const fullPath = join(this.projectsDirectory, repositoryPath);
    const composeFiles: string[] = [];

    const findComposeFiles = async (dir: string, relativePath = ''): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const entryPath = join(dir, entry.name);
          const relativeEntryPath = join(relativePath, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await findComposeFiles(entryPath, relativeEntryPath);
          } else if (entry.isFile()) {
            const fileName = entry.name.toLowerCase();
            if (fileName === 'docker-compose.yml' ||
                fileName === 'docker-compose.yaml' ||
                fileName === 'compose.yml' ||
                fileName === 'compose.yaml') {
              composeFiles.push(relativePath || '.');
            }
          }
        }
      } catch (error) {
        // Ignore errors reading directories
      }
    };

    await findComposeFiles(fullPath);
    return composeFiles;
  }

  async autoDiscoverServices(repositoryPath: string): Promise<Array<{ name: string; directory: string; compose_file?: string; env_file?: string }>> {
    const composeDirectories = await this.discoverComposeFiles(repositoryPath);
    const services: Array<{ name: string; directory: string; compose_file?: string; env_file?: string }> = [];

    for (const composeDir of composeDirectories) {
      const fullPath = join(this.projectsDirectory, repositoryPath, composeDir);

      try {
        const entries = await fs.readdir(fullPath);

        // Find compose file
        const composeFile = entries.find(file =>
          ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'].includes(file.toLowerCase())
        );

        // Find env file
        const envFile = entries.find(file =>
          file === '.env' || file.startsWith('.env.')
        );

        if (composeFile) {
          const serviceName = composeDir === '.' ? repositoryPath : `${repositoryPath}-${composeDir.replace(/[^a-zA-Z0-9]/g, '-')}`;

          services.push({
            name: serviceName,
            directory: join(this.projectsDirectory, repositoryPath, composeDir),
            compose_file: composeFile,
            env_file: envFile
          });
        }
      } catch (error) {
        console.error(`Error discovering services in ${fullPath}:`, error);
      }
    }

    return services;
  }

  setProjectsDirectory(directory: string): void {
    this.projectsDirectory = directory;
  }

  getProjectsDirectory(): string {
    return this.projectsDirectory;
  }
}

export const gitManager = new GitManager();