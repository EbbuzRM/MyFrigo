import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Definizione dei livelli di log
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  NONE = 4 // Per disabilitare completamente i log
}

// Configurazione del logger
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFileLogging: boolean;
  maxLogFileSize: number; // in bytes
  maxLogFiles: number;
}

class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logFilePath: string;
  private isInitialized: boolean = false;
  private pendingLogs: string[] = [];

  private constructor() {
    this.config = {
      minLevel: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableFileLogging: !__DEV__, // Abilita il logging su file solo in produzione
      maxLogFileSize: 1024 * 1024, // 1MB
      maxLogFiles: 5
    };

    this.logFilePath = FileSystem.documentDirectory + 'logs/app.log';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Inizializza il logger
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (this.config.enableFileLogging && Platform.OS !== 'web') {
        // Assicurati che la directory dei log esista
        const logDir = FileSystem.documentDirectory + 'logs/';
        const dirInfo = await FileSystem.getInfoAsync(logDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(logDir, { intermediates: true });
        }

        // Verifica se il file di log esiste
        const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);
        if (fileInfo.exists && fileInfo.size > this.config.maxLogFileSize) {
          await this.rotateLogFiles();
        }

        // Scrivi i log pendenti
        if (this.pendingLogs.length > 0) {
          const logsToWrite = this.pendingLogs.join('\n') + '\n';
          // Leggi il contenuto esistente e aggiungi i nuovi log
          let existingContent = '';
          try {
            const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);
            if (fileInfo.exists) {
              existingContent = await FileSystem.readAsStringAsync(this.logFilePath);
            }
          } catch (error) {
            console.error('Error reading log file:', error);
          }
          
          await FileSystem.writeAsStringAsync(this.logFilePath, existingContent + logsToWrite, {
            encoding: FileSystem.EncodingType.UTF8
          });
          this.pendingLogs = [];
        }
      }

      this.isInitialized = true;
      this.log(LogLevel.INFO, 'LoggingService', 'Logger initialized successfully');
    } catch (error) {
      console.error('Failed to initialize logger:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Configura il logger
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.log(LogLevel.INFO, 'LoggingService', 'Logger configuration updated', config);
  }

  /**
   * Log di debug
   */
  public debug(tag: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, tag, message, data);
  }

  /**
   * Log informativo
   */
  public info(tag: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, tag, message, data);
  }

  /**
   * Log di avviso
   */
  public warning(tag: string, message: string, data?: any): void {
    this.log(LogLevel.WARNING, tag, message, data);
  }

  /**
   * Log di errore
   */
  public error(tag: string, message: string, error?: any): void {
    if (error) {
      this.log(LogLevel.ERROR, tag, message, error);
    } else {
      this.log(LogLevel.ERROR, tag, message);
    }
  }

  /**
   * Metodo principale per il logging
   */
  public log(level: LogLevel, tag: string, message: string, data?: any): void {
    if (level < this.config.minLevel) return;
    
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    
    // Formatta il messaggio di log
    let logMessage = `${timestamp} [${levelStr}] [${tag}] ${message}`;
    
    // Aggiungi i dati se presenti
    if (data !== undefined) {
      if (data instanceof Error) {
        logMessage += `\nError: ${data.message}\nStack: ${data.stack || 'No stack trace available'}`;
      } else if (typeof data === 'object') {
        try {
          logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
        } catch (e) {
          logMessage += `\nData: [Object cannot be stringified]`;
        }
      } else {
        logMessage += `\nData: ${data}`;
      }
    }

    // Log su console se abilitato
    if (this.config.enableConsole) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(logMessage);
          break;
        case LogLevel.INFO:
          console.info(logMessage);
          break;
        case LogLevel.WARNING:
          console.warn(logMessage);
          break;
        case LogLevel.ERROR:
          console.error(logMessage);
          break;
      }
    }

    // Log su file se abilitato
    if (this.config.enableFileLogging && Platform.OS !== 'web') {
      this.writeToLogFile(logMessage);
    }
  }

  /**
   * Scrive un messaggio nel file di log
   */
  private async writeToLogFile(message: string): Promise<void> {
    if (!this.isInitialized) {
      // Salva il log per scriverlo dopo l'inizializzazione
      this.pendingLogs.push(message);
      return;
    }

    try {
      // Leggi il contenuto esistente e aggiungi il nuovo messaggio
      let existingContent = '';
      try {
        const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);
        if (fileInfo.exists) {
          existingContent = await FileSystem.readAsStringAsync(this.logFilePath);
        }
      } catch (error) {
        console.error('Error reading log file:', error);
      }
      
      await FileSystem.writeAsStringAsync(this.logFilePath, existingContent + message + '\n', {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Verifica la dimensione del file di log
      const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);
      if (fileInfo.exists && fileInfo.size > this.config.maxLogFileSize) {
        await this.rotateLogFiles();
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Ruota i file di log quando il file corrente diventa troppo grande
   */
  private async rotateLogFiles(): Promise<void> {
    try {
      // Rinomina i file di log esistenti
      for (let i = this.config.maxLogFiles - 1; i > 0; i--) {
        const oldPath = `${FileSystem.documentDirectory}logs/app.log.${i - 1}`;
        const newPath = `${FileSystem.documentDirectory}logs/app.log.${i}`;
        
        const oldFileInfo = await FileSystem.getInfoAsync(oldPath);
        if (oldFileInfo.exists) {
          await FileSystem.moveAsync({ from: oldPath, to: newPath });
        }
      }

      // Rinomina il file di log corrente
      const newPath = `${FileSystem.documentDirectory}logs/app.log.0`;
      await FileSystem.moveAsync({ from: this.logFilePath, to: newPath });
      
      // Crea un nuovo file di log vuoto
      await FileSystem.writeAsStringAsync(this.logFilePath, '', {
        encoding: FileSystem.EncodingType.UTF8
      });
    } catch (error) {
      console.error('Failed to rotate log files:', error);
    }
  }

  /**
   * Ottiene i log correnti
   */
  public async getLogs(): Promise<string> {
    if (!this.config.enableFileLogging || Platform.OS === 'web') {
      return 'File logging is disabled or not supported on this platform';
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);
      if (!fileInfo.exists) {
        return 'No log file exists';
      }

      return await FileSystem.readAsStringAsync(this.logFilePath, {
        encoding: FileSystem.EncodingType.UTF8
      });
    } catch (error) {
      console.error('Failed to read log file:', error);
      return `Error reading logs: ${error}`;
    }
  }

  /**
   * Cancella tutti i log
   */
  public async clearLogs(): Promise<void> {
    if (!this.config.enableFileLogging || Platform.OS === 'web') {
      return;
    }

    try {
      await FileSystem.writeAsStringAsync(this.logFilePath, '', {
        encoding: FileSystem.EncodingType.UTF8
      });
      this.log(LogLevel.INFO, 'LoggingService', 'Logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }
}

// Esporta un'istanza singleton del logger
export const LoggingService = Logger.getInstance();
