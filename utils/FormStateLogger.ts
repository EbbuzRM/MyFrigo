import { LoggingService } from '@/services/LoggingService';

/**
 * Sistema di logging per tracciare lo stato dei form e la navigazione tra schermate
 * Utile per diagnosticare problemi di perdita dati durante la navigazione
 */
export class FormStateLogger {
  private static instance: FormStateLogger;
  private navigationHistory: Array<{
    timestamp: number;
    action: string;
    from: string;
    to: string;
    data?: unknown;
  }> = [];
  private formStates: Map<string, {
    timestamp: number;
    data: unknown;
  }> = new Map();

  private constructor() { }

  public static getInstance(): FormStateLogger {
    if (!FormStateLogger.instance) {
      FormStateLogger.instance = new FormStateLogger();
    }
    return FormStateLogger.instance;
  }

  /**
   * Registra un'azione di navigazione
   */
  public logNavigation(action: string, from: string, to: string, data?: unknown): void {
    const entry = {
      timestamp: Date.now(),
      action,
      from,
      to,
      data
    };

    this.navigationHistory.push(entry);
    LoggingService.info('FormStateLogger', `Navigation: ${action} from ${from} to ${to}`, data);
  }

  /**
   * Salva lo stato di un form
   */
  public saveFormState(formId: string, data: unknown): void {
    this.formStates.set(formId, {
      timestamp: Date.now(),
      data
    });

    LoggingService.info('FormStateLogger', `Form state saved: ${formId}`, data);
  }

  /**
   * Recupera lo stato di un form
   */
  public getFormState<T = unknown>(formId: string): T | null {
    const state = this.formStates.get(formId);
    if (state) {
      LoggingService.info('FormStateLogger', `Form state retrieved: ${formId}`, state.data);
      return state.data as T;
    }

    LoggingService.warning('FormStateLogger', `Form state not found: ${formId}`);
    return null;
  }

  /**
   * Verifica se ci sono differenze tra due stati
   */
  public compareStates(stateA: Record<string, unknown>, stateB: Record<string, unknown>): {
    hasDifferences: boolean;
    differences: { key: string; oldValue: unknown; newValue: unknown }[]
  } {
    const differences: { key: string; oldValue: unknown; newValue: unknown }[] = [];

    // Verifica le chiavi in stateA
    Object.keys(stateA || {}).forEach(key => {
      if (stateB && JSON.stringify(stateA[key]) !== JSON.stringify(stateB[key])) {
        differences.push({
          key,
          oldValue: stateA[key],
          newValue: stateB ? stateB[key] : undefined
        });
      }
    });

    // Verifica le chiavi in stateB che non sono in stateA
    Object.keys(stateB || {}).forEach(key => {
      if (stateA && !(key in stateA)) {
        differences.push({
          key,
          oldValue: undefined,
          newValue: stateB[key]
        });
      }
    });

    return {
      hasDifferences: differences.length > 0,
      differences
    };
  }

  /**
   * Ottiene la cronologia di navigazione
   */
  public getNavigationHistory(): Array<{ timestamp: number; action: string; from: string; to: string; data?: unknown }> {
    return [...this.navigationHistory];
  }

  /**
   * Ottiene un riepilogo dello stato attuale
   */
  public getStateSummary(): Record<string, unknown> {
    const formStatesSummary: Record<string, unknown> = {};

    this.formStates.forEach((value, key) => {
      formStatesSummary[key] = {
        timestamp: value.timestamp,
        lastUpdated: new Date(value.timestamp).toISOString(),
        dataKeys: Object.keys(value.data as Record<string, unknown> || {})
      };
    });

    return {
      navigationHistoryLength: this.navigationHistory.length,
      lastNavigation: this.navigationHistory.length > 0
        ? this.navigationHistory[this.navigationHistory.length - 1]
        : null,
      formStates: formStatesSummary
    };
  }

  /**
   * Pulisce la cronologia di navigazione
   */
  public clearNavigationHistory(): void {
    this.navigationHistory = [];
    LoggingService.info('FormStateLogger', 'Navigation history cleared');
  }

  /**
   * Pulisce tutti gli stati dei form
   */
  public clearFormStates(): void {
    this.formStates.clear();
    LoggingService.info('FormStateLogger', 'Form states cleared');
  }

  /**
   * Pulisce tutto
   */
  public clearAll(): void {
    this.clearNavigationHistory();
    this.clearFormStates();
  }
}

export const formStateLogger = FormStateLogger.getInstance();