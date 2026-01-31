import { Platform } from 'react-native';
import { LogFileManager } from './LogFileManager';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  NONE = 4
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFileLogging: boolean;
  batchInterval: number;
  batchSize: number;
}

class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private fileManager: LogFileManager | null = null;
  private logQueue: string[] = [];
  private isWriting: boolean = false;
  private batchTimer: ReturnType<typeof setInterval> | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.config = {
      minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableFileLogging: !__DEV__,
      batchInterval: 1000,
      batchSize: 10
    };
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      if (this.config.enableFileLogging && Platform.OS !== 'web') {
        this.fileManager = new LogFileManager();
        await this.fileManager.initialize();
        this.batchTimer = setInterval(() => this.flushQueue(), this.config.batchInterval);
      }
      this.isInitialized = true;
      this.log(LogLevel.INFO, 'LoggingService', 'Logger initialized successfully');
    } catch (error) {
      console.error('Failed to initialize logger:', error);
      this.isInitialized = false;
    }
  }

  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.log(LogLevel.INFO, 'LoggingService', 'Logger configuration updated', config);
  }

  public debug(tag: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, tag, message, data);
  }

  public info(tag: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, tag, message, data);
  }

  public warning(tag: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARNING, tag, message, data);
  }

  public error(tag: string, message: string, error?: unknown): void {
    this.log(LogLevel.ERROR, tag, message, error ?? undefined);
  }

  public log(level: LogLevel, tag: string, message: string, data?: unknown): void {
    if (level < this.config.minLevel) return;
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    let logMessage = `${timestamp} [${levelStr}] [${tag}] ${message}`;
    if (data !== undefined) {
      if (data instanceof Error) logMessage += `\nError: ${data.message}\nStack: ${data.stack || 'No stack trace'}`;
      else if (typeof data === 'object') {
        try { logMessage += `\nData: ${JSON.stringify(data, null, 2)}`; } 
        catch { logMessage += `\nData: [Object cannot be stringified]`; }
      } else logMessage += `\nData: ${data}`;
    }
    if (this.config.enableConsole) {
      const fn = level === LogLevel.DEBUG ? console.debug : level === LogLevel.INFO ? console.info :
        level === LogLevel.WARNING ? console.warn : console.error;
      fn(logMessage);
    }
    if (this.config.enableFileLogging && Platform.OS !== 'web') this.queueLog(logMessage);
  }

  private queueLog(message: string): void {
    this.logQueue.push(message);
    if (this.logQueue.length >= this.config.batchSize) {
      this.flushQueue();
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.isWriting || this.logQueue.length === 0 || !this.fileManager) return;
    this.isWriting = true;
    const logsToWrite = [...this.logQueue];
    this.logQueue = [];
    try {
      await this.fileManager.writeBatch(logsToWrite);
    } catch (error) {
      console.error('Failed to flush log queue:', error);
      this.logQueue.unshift(...logsToWrite);
    } finally {
      this.isWriting = false;
    }
  }

  public async getLogs(): Promise<string> {
    if (!this.fileManager) return 'File logging is disabled or not supported on this platform';
    await this.flushQueue();
    return this.fileManager.getLogs();
  }

  public async clearLogs(): Promise<void> {
    if (!this.fileManager) return;
    await this.flushQueue();
    await this.fileManager.clear();
    this.log(LogLevel.INFO, 'LoggingService', 'Logs cleared');
  }

  public destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    this.flushQueue();
  }
}

export const LoggingService = Logger.getInstance();
