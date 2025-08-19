import { LoggingService } from '@/services/LoggingService';

/**
 * Sistema di logging avanzato per il processo di autenticazione
 * Traccia cronologicamente ogni fase del processo con timestamp e durata
 */
export class AuthLogger {
  private static instance: AuthLogger;
  private steps: Array<{
    step: string;
    timestamp: number;
    duration?: number;
    status: 'start' | 'success' | 'error';
    error?: any;
    data?: any;
  }> = [];
  private startTime: number = 0;
  private isAuthInProgress: boolean = false;

  private constructor() {}

  public static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }

  /**
   * Inizia il processo di autenticazione e registra il timestamp di inizio
   */
  public startAuth(): void {
    this.steps = [];
    this.startTime = Date.now();
    this.isAuthInProgress = true;
    this.logStep('AUTH_PROCESS_STARTED', 'start');
    LoggingService.info('AuthLogger', 'Processo di autenticazione iniziato');
  }

  /**
   * Registra l'inizio di un passaggio del processo di autenticazione
   */
  public startStep(step: string, data?: any): void {
    if (!this.isAuthInProgress) {
      this.startAuth();
    }
    this.logStep(step, 'start', data);
  }

  /**
   * Registra il completamento con successo di un passaggio
   */
  public endStep(step: string, data?: any): void {
    const startStep = this.findLastStepByName(step, 'start');
    if (startStep) {
      const duration = Date.now() - startStep.timestamp;
      this.logStep(step, 'success', data, duration);
    } else {
      this.logStep(step, 'success', data);
    }
  }

  /**
   * Registra un errore durante un passaggio
   */
  public errorStep(step: string, error: any, data?: any): void {
    const startStep = this.findLastStepByName(step, 'start');
    if (startStep) {
      const duration = Date.now() - startStep.timestamp;
      this.logStep(step, 'error', data, duration, error);
    } else {
      this.logStep(step, 'error', data, undefined, error);
    }
  }

  /**
   * Completa il processo di autenticazione e registra la durata totale
   */
  public completeAuth(success: boolean = true): void {
    try {
      const totalDuration = Date.now() - this.startTime;
      this.logStep(
        success ? 'AUTH_PROCESS_COMPLETED' : 'AUTH_PROCESS_FAILED',
        success ? 'success' : 'error',
        { totalDuration }
      );
      this.isAuthInProgress = false;

      // Log dettagliato dell'intero processo
      const summary = this.getAuthSummary();
      LoggingService.info('AuthLogger', 'Riepilogo processo di autenticazione', summary);
      
      // Log aggiuntivo per debug
      LoggingService.info('AuthLogger', `Processo di autenticazione ${success ? 'completato con successo' : 'fallito'} in ${totalDuration}ms`);
    } catch (error) {
      LoggingService.error('AuthLogger', 'Errore durante il completamento del processo di autenticazione', error);
      this.isAuthInProgress = false;
    }
  }

  /**
   * Ottiene un riepilogo del processo di autenticazione
   */
  public getAuthSummary(): any {
    const successSteps = this.steps.filter(s => s.status === 'success').length;
    const errorSteps = this.steps.filter(s => s.status === 'error').length;
    const pendingSteps = this.steps.filter(s => s.status === 'start' && 
      !this.steps.some(s2 => s2.step === s.step && s2.status !== 'start')).length;
    
    const totalDuration = this.isAuthInProgress 
      ? Date.now() - this.startTime 
      : this.steps[this.steps.length - 1]?.timestamp - this.startTime;
    
    const stepsWithDuration = this.steps
      .filter(s => s.status !== 'start')
      .map(s => ({
        step: s.step,
        status: s.status,
        duration: s.duration || 0
      }))
      .sort((a, b) => b.duration - a.duration);
    
    return {
      isComplete: !this.isAuthInProgress,
      totalDuration,
      totalSteps: this.steps.length,
      successSteps,
      errorSteps,
      pendingSteps,
      slowestSteps: stepsWithDuration.slice(0, 3),
      timeline: this.steps.map(s => ({
        step: s.step,
        status: s.status,
        timeFromStart: s.timestamp - this.startTime,
        duration: s.duration
      }))
    };
  }

  /**
   * Verifica se ci sono operazioni in sospeso che potrebbero causare blocchi
   */
  public checkForBlockingOperations(): string[] {
    const blockingOperations: string[] = [];
    
    // Trova passaggi iniziati ma non completati
    const startedSteps = new Map<string, number>();
    
    this.steps.forEach(step => {
      if (step.status === 'start') {
        startedSteps.set(step.step, step.timestamp);
      } else {
        startedSteps.delete(step.step);
      }
    });
    
    // Controlla quali operazioni sono in corso da troppo tempo
    const now = Date.now();
    startedSteps.forEach((timestamp, step) => {
      const duration = now - timestamp;
      if (duration > 5000) { // 5 secondi come soglia
        blockingOperations.push(`${step} (${Math.round(duration / 1000)}s)`);
      }
    });
    
    return blockingOperations;
  }

  /**
   * Registra un passaggio nel log
   */
  private logStep(
    step: string, 
    status: 'start' | 'success' | 'error', 
    data?: any, 
    duration?: number,
    error?: any
  ): void {
    const timestamp = Date.now();
    this.steps.push({
      step,
      timestamp,
      status,
      duration,
      data,
      error
    });

    // Log anche nel sistema di logging generale
    const message = `Auth step ${status}: ${step}${duration ? ` (${duration}ms)` : ''}`;
    
    switch (status) {
      case 'start':
        LoggingService.info('AuthLogger', message, data);
        break;
      case 'success':
        LoggingService.info('AuthLogger', message, data);
        break;
      case 'error':
        LoggingService.error('AuthLogger', message, error);
        break;
    }
  }

  /**
   * Trova l'ultimo passaggio con un determinato nome e stato
   */
  private findLastStepByName(stepName: string, status: 'start' | 'success' | 'error') {
    for (let i = this.steps.length - 1; i >= 0; i--) {
      if (this.steps[i].step === stepName && this.steps[i].status === status) {
        return this.steps[i];
      }
    }
    return null;
  }
}

export const authLogger = AuthLogger.getInstance();