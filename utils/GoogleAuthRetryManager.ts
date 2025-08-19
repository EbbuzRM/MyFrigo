import { LoggingService } from '@/services/LoggingService';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GoogleAuthAttempt {
  userId: string;
  email: string;
  attemptNumber: number;
  timestamp: number;
  profileData: {
    first_name: string | null;
    last_name: string | null;
  };
  isDefaultProfile: boolean; // true se usa "Utente" e "Anonimo"
}

export interface GoogleAuthRetryResult {
  shouldRetry: boolean;
  shouldShowError: boolean;
  attemptNumber: number;
  isExistingUser: boolean;
  message?: string;
}

export class GoogleAuthRetryManager {
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly RETRY_WINDOW_MS = 30 * 60 * 1000; // 30 minuti
  private static readonly STORAGE_KEY_PREFIX = 'google_auth_retry_';

  /**
   * Salva un tentativo di autenticazione Google
   */
  static async saveAttempt(attempt: GoogleAuthAttempt): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}${attempt.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(attempt));
      LoggingService.info('GoogleAuthRetryManager', 'Tentativo di autenticazione salvato', {
        userId: attempt.userId,
        attemptNumber: attempt.attemptNumber,
        isDefaultProfile: attempt.isDefaultProfile
      });
    } catch (error) {
      LoggingService.error('GoogleAuthRetryManager', 'Errore nel salvataggio del tentativo', error);
    }
  }

  /**
   * Recupera l'ultimo tentativo di autenticazione per un utente
   */
  static async getLastAttempt(userId: string): Promise<GoogleAuthAttempt | null> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}${userId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const attempt = JSON.parse(data) as GoogleAuthAttempt;
        // Verifica se il tentativo è ancora valido (entro la finestra di retry)
        const isWithinWindow = Date.now() - attempt.timestamp < this.RETRY_WINDOW_MS;
        if (isWithinWindow) {
          return attempt;
        } else {
          // Rimuovi il tentativo scaduto
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      LoggingService.error('GoogleAuthRetryManager', 'Errore nel recupero del tentativo', error);
    }
    return null;
  }

  /**
   * Pulisce i tentativi di autenticazione per un utente
   */
  static async clearAttempts(userId: string): Promise<void> {
    try {
      const key = `${this.STORAGE_KEY_PREFIX}${userId}`;
      await AsyncStorage.removeItem(key);
      LoggingService.info('GoogleAuthRetryManager', 'Tentativi di autenticazione puliti', { userId });
    } catch (error) {
      LoggingService.error('GoogleAuthRetryManager', 'Errore nella pulizia dei tentativi', error);
    }
  }

  /**
   * Determina se un profilo è considerato "predefinito" (problematico)
   */
  static isDefaultProfile(firstName: string | null, lastName: string | null): boolean {
    const defaultFirstNames = ['Utente', 'User', ''];
    const defaultLastNames = ['Anonimo', 'Anonymous', ''];
    
    return (
      defaultFirstNames.includes(firstName || '') ||
      defaultLastNames.includes(lastName || '') ||
      (!firstName && !lastName)
    );
  }

  /**
   * Analizza la situazione e determina se dovrebbe essere fatto un retry
   */
  static async analyzeRetryNeed(
    userId: string,
    email: string,
    currentProfile: { first_name: string | null; last_name: string | null }
  ): Promise<GoogleAuthRetryResult> {
    const lastAttempt = await this.getLastAttempt(userId);
    const isCurrentProfileDefault = this.isDefaultProfile(currentProfile.first_name, currentProfile.last_name);
    
    LoggingService.info('GoogleAuthRetryManager', 'Analisi retry necessario', {
      userId,
      email,
      hasLastAttempt: !!lastAttempt,
      isCurrentProfileDefault,
      currentProfile
    });

    // Se il profilo corrente è completo e valido, non serve retry
    if (!isCurrentProfileDefault) {
      if (lastAttempt) {
        await this.clearAttempts(userId);
      }
      return {
        shouldRetry: false,
        shouldShowError: false,
        attemptNumber: 0,
        isExistingUser: true
      };
    }

    // Se non c'è un tentativo precedente, questo è il primo
    if (!lastAttempt) {
      const newAttempt: GoogleAuthAttempt = {
        userId,
        email,
        attemptNumber: 1,
        timestamp: Date.now(),
        profileData: currentProfile,
        isDefaultProfile: isCurrentProfileDefault
      };
      
      await this.saveAttempt(newAttempt);
      
      return {
        shouldRetry: true,
        shouldShowError: false,
        attemptNumber: 1,
        isExistingUser: true,
        message: 'Primo tentativo con profilo incompleto, riprovando...'
      };
    }

    // C'è un tentativo precedente
    const nextAttemptNumber = lastAttempt.attemptNumber + 1;

    if (nextAttemptNumber <= this.MAX_RETRY_ATTEMPTS) {
      // Aggiorna il tentativo
      const updatedAttempt: GoogleAuthAttempt = {
        ...lastAttempt,
        attemptNumber: nextAttemptNumber,
        timestamp: Date.now(),
        profileData: currentProfile,
        isDefaultProfile: isCurrentProfileDefault
      };
      
      await this.saveAttempt(updatedAttempt);
      
      return {
        shouldRetry: true,
        shouldShowError: false,
        attemptNumber: nextAttemptNumber,
        isExistingUser: true,
        message: `Tentativo ${nextAttemptNumber}/${this.MAX_RETRY_ATTEMPTS} con profilo incompleto, riprovando...`
      };
    } else {
      // Superato il numero massimo di tentativi
      await this.clearAttempts(userId);
      
      return {
        shouldRetry: false,
        shouldShowError: true,
        attemptNumber: nextAttemptNumber,
        isExistingUser: true,
        message: 'Raggiunto il numero massimo di tentativi. Riprova più tardi.'
      };
    }
  }

  /**
   * Mostra un messaggio di feedback all'utente durante i tentativi
   */
  static showRetryFeedback(attemptNumber: number, maxAttempts: number = this.MAX_RETRY_ATTEMPTS): void {
    const message = `Tentativo ${attemptNumber}/${maxAttempts}: Recupero delle informazioni del profilo in corso...`;
    
    // Mostra un toast o un alert non bloccante
    LoggingService.info('GoogleAuthRetryManager', 'Feedback retry mostrato', { attemptNumber, message });
    
    // Per ora usiamo un alert, ma potrebbe essere sostituito con un toast
    if (attemptNumber > 1) {
      Alert.alert(
        'Recupero Profilo',
        message,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    }
  }

  /**
   * Mostra un messaggio di errore finale quando tutti i tentativi falliscono
   */
  static showMaxAttemptsError(): void {
    Alert.alert(
      'Problema di Autenticazione',
      'Non è stato possibile recuperare completamente le informazioni del tuo profilo Google dopo diversi tentativi. Questo potrebbe essere dovuto a un problema temporaneo con i servizi di autenticazione.\n\nPuoi:\n• Riprovare ad accedere più tardi\n• Usare l\'accesso con email e password\n• Completare manualmente il profilo se necessario',
      [
        { text: 'Riprova più tardi', style: 'default' },
        { text: 'OK', style: 'cancel' }
      ]
    );
  }

  /**
   * Determina se un utente dovrebbe essere considerato "nuovo" o "esistente con problemi"
   */
  static async isLikelyNewUser(userId: string, email: string): Promise<boolean> {
    // Logica per determinare se è un nuovo utente:
    // 1. Non ha tentativi precedenti
    // 2. Non ha dati in cache
    // 3. L'email non è mai stata vista prima
    
    const lastAttempt = await this.getLastAttempt(userId);
    
    // Se non ci sono tentativi precedenti, potrebbe essere un nuovo utente
    if (!lastAttempt) {
      // Qui potresti aggiungere ulteriori controlli, come verificare
      // se l'email è già presente nel database degli utenti
      return true;
    }
    
    // Se ci sono tentativi precedenti, è probabilmente un utente esistente con problemi
    return false;
  }
}