// LogFileManager.ts — LogFileManager module.
//
// exports: getLogFileManagerErrors | clearLogFileManagerErrors | LogFileManager
// used_by: services\LoggingService.ts
// rules:   The module uses expo-file-system for file operations and must only be initialized on native platforms (iOS/Android), with rotation logic triggered when maxFileSize is exceeded.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { Paths, Directory, File } from 'expo-file-system';
import { Platform } from 'react-native';

// Buffer statico per errori, accessibile da LoggingService
const errorBuffer: Array<{ timestamp: string; message: string; error?: unknown }> = [];
const MAX_BUFFER_SIZE = 50;

function logError(message: string, error?: unknown): void {
  // Must use console.error to avoid circular dependency with LoggingService (LoggingService imports LogFileManager)
  console.error(message, error);
  errorBuffer.push({ timestamp: new Date().toISOString(), message, error });
  if (errorBuffer.length > MAX_BUFFER_SIZE) errorBuffer.shift();
}

/** Accessibile da LoggingService per recuperare gli errori del LogFileManager */
export function getLogFileManagerErrors() {
  return [...errorBuffer];
}

/** Accessibile da LoggingService per svuotare il buffer errori */
export function clearLogFileManagerErrors() {
  errorBuffer.length = 0;
}

interface LogFileManagerConfig {
  maxFileSize: number;
  maxFiles: number;
  logsDirectoryName: string;
  logFileName: string;
}

export class LogFileManager {
  private config: LogFileManagerConfig;
  private logsDirectory: Directory | null = null;
  private logFile: File | null = null;
  private isInitialized: boolean = false;

  constructor(config?: Partial<LogFileManagerConfig>) {
    this.config = {
      maxFileSize: 1024 * 1024,
      maxFiles: 5,
      logsDirectoryName: 'logs',
      logFileName: 'app.log',
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || Platform.OS === 'web') return;
    try {
      this.logsDirectory = new Directory(Paths.document, this.config.logsDirectoryName);
      if (!this.logsDirectory.exists) {
        this.logsDirectory.create({ intermediates: true });
      }
      this.logFile = new File(this.logsDirectory, this.config.logFileName);
      if (this.logFile.exists) {
        const fileInfo = this.logFile.info();
        if (fileInfo.size !== undefined && fileInfo.size > this.config.maxFileSize) {
          await this.rotate();
        }
      }
      this.isInitialized = true;
    } catch (error) {
      logError('Failed to initialize LogFileManager:', error);
      this.isInitialized = false;
    }
  }

  async write(message: string): Promise<void> {
    if (!this.isInitialized || !this.logFile) return;
    try {
      let content = this.logFile.exists ? await this.logFile.text() : '';
      const newContent = content + message + '\n';
      this.logFile.write(newContent, { encoding: 'utf8' as const });
      const fileInfo = this.logFile.info();
      if (fileInfo.size !== undefined && fileInfo.size > this.config.maxFileSize) {
        await this.rotate();
      }
    } catch (error) {
      logError('Failed to write to log file:', error);
    }
  }

  async writeBatch(messages: string[]): Promise<void> {
    if (!this.isInitialized || !this.logFile || messages.length === 0) return;
    try {
      let content = this.logFile.exists ? await this.logFile.text() : '';
      const newContent = content + messages.join('\n') + '\n';
      this.logFile.write(newContent, { encoding: 'utf8' as const });
      const fileInfo = this.logFile.info();
      if (fileInfo.size !== undefined && fileInfo.size > this.config.maxFileSize) {
        await this.rotate();
      }
    } catch (error) {
      logError('Failed to write batch to log file:', error);
    }
  }

  async rotate(): Promise<void> {
    if (!this.logsDirectory || !this.logFile) return;
    try {
      for (let i = this.config.maxFiles - 1; i > 0; i--) {
        const oldFile = new File(this.logsDirectory, `app.log.${i - 1}`);
        const newFile = new File(this.logsDirectory, `app.log.${i}`);
        if (oldFile.exists) oldFile.move(newFile);
      }
      const rotatedFile = new File(this.logsDirectory, 'app.log.0');
      this.logFile.move(rotatedFile);
      this.logFile = new File(this.logsDirectory, this.config.logFileName);
      this.logFile.write('', { encoding: 'utf8' as const });
    } catch (error) {
      logError('Failed to rotate log files:', error);
    }
  }

  async getLogs(): Promise<string> {
    if (Platform.OS === 'web') return 'File logging is not supported on web platform';
    try {
      if (!this.logFile || !this.logFile.exists) return 'No log file exists';
      return await this.logFile.text();
    } catch (error) {
      logError('Failed to read log file:', error);
      return `Error reading logs: ${error}`;
    }
  }

  async getRecentLogs(maxLines: number = 500): Promise<string> {
    if (Platform.OS === 'web') return 'File logging is not supported on web platform';
    try {
      if (!this.logFile || !this.logFile.exists) return 'No log file exists';
      const fullContent = await this.logFile.text();
      const lines = fullContent.split('\n').filter(line => line.trim() !== '');
      const recentLines = lines.slice(-maxLines);
      return recentLines.join('\n');
    } catch (error) {
      logError('Failed to read recent logs:', error);
      return `Error reading logs: ${error}`;
    }
  }

  async applyRetention(maxDays: number = 7, maxLines: number = 1000): Promise<void> {
    if (Platform.OS === 'web' || !this.logFile || !this.logFile.exists) return;
    try {
      const fullContent = await this.logFile.text();
      const lines = fullContent.split('\n').filter(line => line.trim() !== '');
      
      // Filter by date (keep last maxDays)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxDays);
      
      const recentLines = lines.filter(line => {
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
        if (timestampMatch) {
          const logDate = new Date(timestampMatch[1]);
          return logDate >= cutoffDate;
        }
        return true; // Keep lines without timestamps (e.g., stack traces)
      });
      
      // Also limit by max lines
      const finalLines = recentLines.slice(-maxLines);
      
      await this.logFile.write(finalLines.join('\n') + '\n', { encoding: 'utf8' as const });
    } catch (error) {
      logError('Failed to apply log retention:', error);
    }
  }

  async clear(): Promise<void> {
    if (Platform.OS === 'web' || !this.logFile) return;
    try {
      this.logFile.write('', { encoding: 'utf8' as const });
    } catch (error) {
      logError('Failed to clear logs:', error);
    }
  }

  getLogFileInfo(): { exists: boolean; size?: number } {
    if (!this.logFile) return { exists: false };
    const exists = this.logFile.exists;
    const info = exists ? this.logFile.info() : { size: undefined };
    return { exists, size: info.size };
  }

  get initialized(): boolean {
    return this.isInitialized;
  }
}
