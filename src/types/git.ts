export interface GitCloneOptions {
  url: string;
  directory: string;
  branch?: string | undefined;
  depth?: number | undefined;
  recursive?: boolean | undefined;
}

export interface GitStatus {
  repository: string;
  branch: string;
  ahead: number;
  behind: number;
  modified: number;
  staged: number;
  untracked: number;
  lastUpdate: Date;
}

export interface GitUpdateResult {
  repository: string;
  success: boolean;
  changes: number;
  error?: string;
  newCommits?: string[];
}