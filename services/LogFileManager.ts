import { Paths, Directory, File } from 'expo-file-system';
import { Platform } from 'react-native';

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
      console.error('Failed to initialize LogFileManager:', error);
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
      console.error('Failed to write to log file:', error);
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
      console.error('Failed to write batch to log file:', error);
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
      console.error('Failed to rotate log files:', error);
    }
  }

  async getLogs(): Promise<string> {
    if (Platform.OS === 'web') return 'File logging is not supported on web platform';
    try {
      if (!this.logFile || !this.logFile.exists) return 'No log file exists';
      return await this.logFile.text();
    } catch (error) {
      console.error('Failed to read log file:', error);
      return `Error reading logs: ${error}`;
    }
  }

  async clear(): Promise<void> {
    if (Platform.OS === 'web' || !this.logFile) return;
    try {
      this.logFile.write('', { encoding: 'utf8' as const });
    } catch (error) {
      console.error('Failed to clear logs:', error);
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
