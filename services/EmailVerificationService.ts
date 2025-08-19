import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VerificationAttempt {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  attemptedAt: string;
  status: 'pending' | 'success' | 'failed' | 'expired';
  errorMessage?: string;
  deviceInfo?: {
    platform: string;
    userAgent?: string;
    timestamp: string;
  };
}

export interface VerificationSession {
  sessionId: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'completed' | 'expired';
  attempts: VerificationAttempt[];
  completedAt?: string;
}

export interface VerificationProgress {
  stage: 'email_sent' | 'token_received' | 'validating' | 'creating_profile' | 'authenticating' | 'completed' | 'failed';
  message: string;
  progress: number; // 0-100
  timestamp: string;
  details?: any;
}

class EmailVerificationService {
  private static instance: EmailVerificationService;
  private currentSession: VerificationSession | null = null;
  private progressCallbacks: ((progress: VerificationProgress) => void)[] = [];

  static getInstance(): EmailVerificationService {
    if (!EmailVerificationService.instance) {
      EmailVerificationService.instance = new EmailVerificationService();
    }
    return EmailVerificationService.instance;
  }

  // Registra callback per aggiornamenti di progresso
  onProgressUpdate(callback: (progress: VerificationProgress) => void): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      const index = this.progressCallbacks.indexOf(callback);
      if (index > -1) {
        this.progressCallbacks.splice(index, 1);
      }
    };
  }

  private notifyProgress(progress: VerificationProgress) {
    LoggingService.info('EmailVerificationService', 'Progress update', progress);
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        LoggingService.error('EmailVerificationService', 'Error in progress callback', error);
      }
    });
  }

  // Inizia una nuova sessione di verifica
  async startVerificationSession(userId: string, email: string): Promise<VerificationSession> {
    const sessionId = `verification_${userId}_${Date.now()}`;
    const session: VerificationSession = {
      sessionId,
      userId,
      email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 ore
      status: 'active',
      attempts: []
    };

    this.currentSession = session;
    await this.saveSession(session);

    this.notifyProgress({
      stage: 'email_sent',
      message: 'Email di verifica inviata',
      progress: 20,
      timestamp: new Date().toISOString(),
      details: { sessionId, email }
    });

    LoggingService.info('EmailVerificationService', 'Verification session started', {
      sessionId,
      userId,
      email,
      expiresAt: session.expiresAt
    });

    return session;
  }

  // Verifica token email
  async verifyEmailToken(tokenHash: string, type: string = 'signup'): Promise<{
    success: boolean;
    user?: any;
    session?: any;
    error?: string;
    attempt: VerificationAttempt;
  }> {
    const attemptId = `attempt_${Date.now()}`;
    
    this.notifyProgress({
      stage: 'token_received',
      message: 'Token ricevuto, validazione in corso...',
      progress: 40,
      timestamp: new Date().toISOString(),
      details: { tokenHash: tokenHash.substring(0, 10) + '...' }
    });

    const attempt: VerificationAttempt = {
      id: attemptId,
      userId: this.currentSession?.userId || 'unknown',
      email: this.currentSession?.email || 'unknown',
      tokenHash: tokenHash.substring(0, 10) + '...',
      attemptedAt: new Date().toISOString(),
      status: 'pending',
      deviceInfo: {
        platform: 'react-native',
        timestamp: new Date().toISOString()
      }
    };

    try {
      this.notifyProgress({
        stage: 'validating',
        message: 'Validazione token con Supabase...',
        progress: 50,
        timestamp: new Date().toISOString()
      });

      LoggingService.info('EmailVerificationService', 'Starting token verification', {
        attemptId,
        tokenHash: tokenHash.substring(0, 10) + '...',
        type,
        sessionId: this.currentSession?.sessionId
      });

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });

      if (error) {
        attempt.status = 'failed';
        attempt.errorMessage = error.message;
        
        this.notifyProgress({
          stage: 'failed',
          message: `Verifica fallita: ${error.message}`,
          progress: 0,
          timestamp: new Date().toISOString(),
          details: { error: error.message }
        });

        LoggingService.error('EmailVerificationService', 'Token verification failed', {
          attemptId,
          error: error.message,
          errorCode: error.status
        });

        if (this.currentSession) {
          this.currentSession.attempts.push(attempt);
          await this.saveSession(this.currentSession);
        }

        return { success: false, error: error.message, attempt };
      }

      attempt.status = 'success';
      
      this.notifyProgress({
        stage: 'creating_profile',
        message: 'Token validato, creazione profilo...',
        progress: 70,
        timestamp: new Date().toISOString(),
        details: { userId: data.user?.id }
      });

      LoggingService.info('EmailVerificationService', 'Token verification successful', {
        attemptId,
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        hasSession: !!data.session
      });

      if (this.currentSession) {
        this.currentSession.attempts.push(attempt);
        this.currentSession.status = 'completed';
        this.currentSession.completedAt = new Date().toISOString();
        await this.saveSession(this.currentSession);
      }

      return { success: true, user: data.user, session: data.session, attempt };

    } catch (error: any) {
      attempt.status = 'failed';
      attempt.errorMessage = error.message || 'Errore sconosciuto';
      
      this.notifyProgress({
        stage: 'failed',
        message: `Errore durante la verifica: ${error.message}`,
        progress: 0,
        timestamp: new Date().toISOString(),
        details: { error: error.message }
      });

      LoggingService.error('EmailVerificationService', 'Unexpected error during verification', {
        attemptId,
        error: error.message,
        stack: error.stack
      });

      if (this.currentSession) {
        this.currentSession.attempts.push(attempt);
        await this.saveSession(this.currentSession);
      }

      return { success: false, error: error.message, attempt };
    }
  }

  // Crea profilo utente con dati reali
  async createUserProfile(user: any, profileData?: { firstName?: string; lastName?: string }): Promise<{ success: boolean; profile?: any; error?: string }> {
    try {
      this.notifyProgress({
        stage: 'creating_profile',
        message: 'Creazione profilo utente...',
        progress: 80,
        timestamp: new Date().toISOString(),
        details: { userId: user.id }
      });

      // Usa i dati del profilo passati come parametro, altrimenti fallback ai metadati dell'utente
      const firstName = profileData?.firstName || user.user_metadata?.first_name;
      const lastName = profileData?.lastName || user.user_metadata?.last_name;

      LoggingService.info('EmailVerificationService', 'Creating user profile', {
        userId: user.id,
        firstName,
        lastName,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        profileDataProvided: !!profileData,
        userMetadata: user.user_metadata
      });

      if (!firstName || !lastName) {
        LoggingService.warning('EmailVerificationService', 'Missing profile data in user metadata', {
          firstName,
          lastName,
          profileDataProvided: !!profileData,
          userMetadata: user.user_metadata
        });
      }

      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          first_name: firstName || 'Utente',
          last_name: lastName || 'Anonimo',
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        LoggingService.error('EmailVerificationService', 'Profile creation failed', profileError);
        return { success: false, error: profileError.message };
      }

      const profile = { first_name: firstName || 'Utente', last_name: lastName || 'Anonimo' };
      
      LoggingService.info('EmailVerificationService', 'Profile created successfully', profile);
      
      return { success: true, profile };

    } catch (error: any) {
      LoggingService.error('EmailVerificationService', 'Unexpected error during profile creation', error);
      return { success: false, error: error.message };
    }
  }

  // Completa il processo di autenticazione
  async completeAuthentication(): Promise<{ success: boolean; error?: string }> {
    try {
      this.notifyProgress({
        stage: 'authenticating',
        message: 'Completamento autenticazione...',
        progress: 90,
        timestamp: new Date().toISOString()
      });

      // Forza il refresh della sessione per attivare onAuthStateChange
      const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError) {
        LoggingService.error('EmailVerificationService', 'Session refresh failed', sessionError);
        return { success: false, error: sessionError.message };
      }

      LoggingService.info('EmailVerificationService', 'Session refreshed successfully', {
        hasSession: !!sessionData.session,
        userId: sessionData.user?.id
      });

      this.notifyProgress({
        stage: 'completed',
        message: 'Verifica completata con successo!',
        progress: 100,
        timestamp: new Date().toISOString(),
        details: { userId: sessionData.user?.id }
      });

      return { success: true };

    } catch (error: any) {
      LoggingService.error('EmailVerificationService', 'Unexpected error during authentication completion', error);
      return { success: false, error: error.message };
    }
  }

  // Salva sessione in storage locale
  private async saveSession(session: VerificationSession): Promise<void> {
    try {
      await AsyncStorage.setItem(`verification_session_${session.userId}`, JSON.stringify(session));
    } catch (error) {
      LoggingService.error('EmailVerificationService', 'Failed to save session', error);
    }
  }

  // Recupera sessione da storage locale
  async getSession(userId: string): Promise<VerificationSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(`verification_session_${userId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData) as VerificationSession;
        
        // Controlla se la sessione è scaduta
        if (new Date(session.expiresAt) < new Date()) {
          session.status = 'expired';
          await this.saveSession(session);
        }
        
        return session;
      }
    } catch (error) {
      LoggingService.error('EmailVerificationService', 'Failed to get session', error);
    }
    return null;
  }

  // Ottieni statistiche di verifica
  async getVerificationStats(): Promise<{
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageCompletionTime: number;
    commonErrors: { error: string; count: number }[];
  }> {
    // Implementazione base - in un'app reale questo potrebbe essere collegato a analytics
    const stats = {
      totalAttempts: this.currentSession?.attempts.length || 0,
      successfulAttempts: this.currentSession?.attempts.filter(a => a.status === 'success').length || 0,
      failedAttempts: this.currentSession?.attempts.filter(a => a.status === 'failed').length || 0,
      averageCompletionTime: 0,
      commonErrors: []
    };

    LoggingService.info('EmailVerificationService', 'Verification stats requested', stats);
    
    return stats;
  }

  // Pulisci sessioni scadute
  async cleanupExpiredSessions(): Promise<void> {
    try {
      // Implementazione base - in un'app reale questo potrebbe pulire storage
      LoggingService.info('EmailVerificationService', 'Cleanup expired sessions completed');
    } catch (error) {
      LoggingService.error('EmailVerificationService', 'Failed to cleanup expired sessions', error);
    }
  }

  // Controlla periodicamente lo stato di verifica dell'utente
  async startPollingForVerification(userId: string, email: string, intervalMs: number = 5000, profileData?: { firstName?: string; lastName?: string }): Promise<() => void> {
    LoggingService.info('EmailVerificationService', 'Starting verification polling', {
      userId,
      email,
      intervalMs,
      hasProfileData: !!profileData
    });

    let isPolling = true;
    let pollCount = 0;
    const maxPolls = 120; // 10 minuti con intervalli di 5 secondi

    const poll = async () => {
      if (!isPolling || pollCount >= maxPolls) {
        if (pollCount >= maxPolls) {
          this.notifyProgress({
            stage: 'failed',
            message: 'Timeout: verifica email non completata entro 10 minuti',
            progress: 0,
            timestamp: new Date().toISOString(),
            details: { reason: 'polling_timeout', pollCount }
          });
          LoggingService.warning('EmailVerificationService', 'Polling timeout reached', { pollCount, maxPolls });
        }
        return;
      }

      pollCount++;
      
      try {
        LoggingService.debug('EmailVerificationService', `Polling attempt ${pollCount}/${maxPolls}`, {
          userId,
          email
        });

        // Controlla lo stato corrente dell'utente
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          LoggingService.error('EmailVerificationService', 'Error during polling', error);
          setTimeout(poll, intervalMs);
          return;
        }

        if (user && user.email_confirmed_at) {
          LoggingService.info('EmailVerificationService', 'Email verification detected via polling!', {
            userId: user.id,
            email: user.email,
            emailConfirmedAt: user.email_confirmed_at,
            pollCount
          });

          isPolling = false;

          // Notifica il progresso
          this.notifyProgress({
            stage: 'token_received',
            message: 'Verifica email rilevata!',
            progress: 60,
            timestamp: new Date().toISOString(),
            details: {
              detectedViaPolling: true,
              pollCount,
              emailConfirmedAt: user.email_confirmed_at
            }
          });

          // Procedi con la creazione del profilo usando i dati passati
          const profileResult = await this.createUserProfile(user, profileData);
          
          if (!profileResult.success) {
            LoggingService.warning('EmailVerificationService', 'Profile creation failed during polling', profileResult.error);
          }

          // Completa l'autenticazione
          const authResult = await this.completeAuthentication();
          
          if (authResult.success) {
            LoggingService.info('EmailVerificationService', 'Email verification completed successfully via polling');
          } else {
            LoggingService.error('EmailVerificationService', 'Authentication completion failed during polling', authResult.error);
          }

          return;
        }

        // Continua il polling
        setTimeout(poll, intervalMs);

      } catch (error: any) {
        LoggingService.error('EmailVerificationService', 'Unexpected error during polling', {
          error: error.message,
          pollCount
        });
        setTimeout(poll, intervalMs);
      }
    };

    // Inizia il polling
    setTimeout(poll, intervalMs);

    // Restituisce una funzione per fermare il polling
    return () => {
      LoggingService.info('EmailVerificationService', 'Stopping verification polling', { pollCount });
      isPolling = false;
    };
  }

  // Reset del servizio
  reset(): void {
    this.currentSession = null;
    this.progressCallbacks = [];
    LoggingService.info('EmailVerificationService', 'Service reset completed');
  }
}

export const emailVerificationService = EmailVerificationService.getInstance();