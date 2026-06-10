// LoggingService.ts — LoggingService module.
//
// exports: LoggingService
// used_by: app\(tabs)\history.tsx
//         app\(tabs)\index.tsx
//         app\(tabs)\products.tsx
//         app\(tabs)\settings.tsx
//         app\+not-found.tsx
//         app\_layout.tsx
//         app\auth\reset-password.tsx
//         app\confirm-email.tsx
//         app\consumed-list.tsx
//         app\feedback.tsx
//         app\forgot-password.tsx
//         app\history-detail.tsx
//         app\index.tsx
//         app\login.tsx
//         app\manage-categories.tsx
//         app\manual-entry.tsx
//         app\password-reset-form.tsx
//         app\photo-capture.tsx
//         app\profile.tsx
//         app\scanner.tsx
//         components\AddMethodCard.tsx
//         components\AnimatedPressable.tsx
//         components\AnimatedTabBar.tsx
//         components\AnimatedTabItem.tsx
//         components\AppProviders.tsx
//         components\CategoryFilter.tsx
//         components\ConsumeQuantityModal.tsx
//         components\CustomDatePicker.tsx
//         components\DiagnosticPanel.tsx
//         components\ErrorBoundary.tsx
//         components\HistoryStats.tsx
//         components\ProductCard.tsx
//         components\SettingsCard.tsx
//         components\StatsCard.tsx
//         components\SuggestionCard.tsx
//         components\Toast.tsx
//         components\UpdateModal.tsx
//         components\products\CategoryFilterBar.tsx
//         components\products\StatusFilterBar.tsx
//         context\AuthContext.tsx
//         context\CategoryContext.tsx
//         context\ManualEntryActionsContext.tsx
//         context\ManualEntryContext.tsx
//         context\ManualEntryMetaContext.tsx
//         context\ProductContext.tsx
//         context\SettingsContext.tsx
//         context\ThemeContext.tsx
//         context\UpdateContext.tsx
//         hooks\__tests__\useAppLifecycle.test.ts
//         hooks\barcode\useBarcodeCache.ts
//         hooks\barcode\useLocalDatabaseLookup.ts
//         hooks\barcode\useOpenFoodFactsApi.ts
//         hooks\useAppLifecycle.ts
//         hooks\useBarcodeScanner.ts
//         hooks\useCamera.ts
//         hooks\useCategorySelection.ts
//         hooks\useDiagnosticGesture.ts
//         hooks\useDiagnosticTests.ts
//         hooks\useEmailAuth.ts
//         hooks\useExpirationStatus.ts
//         hooks\useGoogleAuth.ts
//         hooks\useHistoryData.ts
//         hooks\usePhotoActions.ts
//         hooks\usePhotoOCR.backup.ts
//         hooks\usePhotoOCR.ts
//         hooks\usePostRegistration.ts
//         hooks\useProductActions.ts
//         hooks\useProductDetail.ts
//         hooks\useProductFormData.ts
//         hooks\useProductInitialization.ts
//         hooks\useProductRefresh.ts
//         hooks\useProductSave.ts
//         hooks\useProductSearch.ts
//         hooks\useProductStatus.ts
//         hooks\useRegistrationActions.ts
//         hooks\useRegistrationOrchestrator.ts
//         hooks\useRegistrationState.ts
//         hooks\useSettingsSections.ts
//         services\AuthService.ts
//         services\CategoryMatcher.ts
//         services\CategoryService.ts
//         services\IconLoader.ts
//         services\IconService.ts
//         services\NotificationCoreService.ts
//         services\NotificationPermissionService.ts
//         services\NotificationService.ts
//         services\OneSignalService.ts
//         services\ProductStorage.ts
//         services\SettingsService.ts
//         services\TemplateService.ts
//         services\UpdateService.ts
//         services\UserDeviceService.ts
//         services\UserNotificationSettingsService.ts
//         services\UserService.ts
//         services\diagnostic\AuthTests.ts
//         services\diagnostic\DatabaseTests.ts
//         services\diagnostic\NotificationTests.ts
//         services\diagnostic\PerformanceTests.ts
//         services\diagnostic\SystemTests.ts
//         services\diagnostic\TestRunner.ts
//         services\supabaseClient.test.ts
//         services\supabaseClient.ts
//         utils\AuthLogger.ts
//         utils\DiagnosticTester.ts
//         utils\FormStateLogger.ts
//         utils\GoogleAuthRetryManager.ts
//         utils\GoogleAuthStorage.ts
//         utils\caseConverter.ts
//         utils\dateUtils\parsers\month-year.ts
//         utils\dateUtils\parsers\sequence.ts
//         utils\dateUtils\parsers\textual.ts
//         utils\dateUtils\validators.ts
//         utils\historyCalculations.ts
//         utils\ocr\ocrSpaceService.ts
//         utils\ocr\parsing.ts
//         utils\ocr\scoring.ts
//         utils\ocr\spatial.ts
// rules:   - All public methods must remain synchronous; do not convert to async or return Promises.
//          - Logger initialization must be done once at import time; do not expose or call a separate init() method.
//          - Log output format (timestamp, level, message) must not be changed without updating all consumers that parse logs.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
  private memoryLogBuffer: string[] = [];
  private readonly MAX_MEMORY_LOGS = 1000;

  private constructor() {
    this.config = {
      minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableFileLogging: true,
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
        // Apply log retention on startup (keep last 7 days or 1000 lines)
        await this.fileManager.applyRetention(7, 1000);
      }
      this.isInitialized = true;
      this.log(LogLevel.INFO, 'LoggingService', 'Logger initialized successfully');
    } catch (error) {
      if (__DEV__) console.error('Failed to initialize logger:', error);
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
    if (!__DEV__) return;
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
      // S-16: In production, only log errors/critical to console
      if (__DEV__ || level >= LogLevel.ERROR) {
        const fn = level === LogLevel.DEBUG ? console.debug : level === LogLevel.INFO ? console.info :
          level === LogLevel.WARNING ? console.warn : console.error;
        fn(logMessage);
      }
    }

    // Always keep in memory buffer (oldest first, newest last)
    this.memoryLogBuffer.push(logMessage); // Più vecchi prima
    if (this.memoryLogBuffer.length > this.MAX_MEMORY_LOGS) {
      this.memoryLogBuffer.shift(); // Rimuovi il più vecchio dalla cima
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
      if (__DEV__) console.error('Failed to flush log queue:', error);
      this.logQueue.unshift(...logsToWrite);
    } finally {
      this.isWriting = false;
    }
  }

  public async getLogs(): Promise<string> {
    if (this.fileManager) {
      await this.flushQueue();
      return this.fileManager.getLogs();
    }
    // In dev mode or when file logging is disabled, return memory buffer
    return this.memoryLogBuffer.join('\n') || 'Nessun log disponibile';
  }

  public async getRecentLogs(maxLines: number = 500): Promise<string> {
    if (this.fileManager) {
      await this.flushQueue();
      return this.fileManager.getRecentLogs(maxLines);
    }
    // In dev mode or when file logging is disabled, return memory buffer (last maxLines)
    return this.memoryLogBuffer.slice(-maxLines).join('\n') || 'Nessun log disponibile';
  }

public async clearLogs(): Promise<void> {
     // Always flush the queue first, regardless of fileManager presence
     await this.flushQueue();
     if (this.fileManager) {
       await this.fileManager.clear();
     }
     // Always clear memory buffer
     this.memoryLogBuffer = [];
     this.log(LogLevel.INFO, 'LoggingService', 'Logs cleared');
   }

public async destroy(): Promise<void> {
     if (this.batchTimer) {
       clearInterval(this.batchTimer);
       this.batchTimer = null;
     }
     await this.flushQueue();
   }
}

export const LoggingService = Logger.getInstance();
