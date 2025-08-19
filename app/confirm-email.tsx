import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, useSegments } from 'expo-router';
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { LoggingService } from '@/services/LoggingService';
import { emailVerificationService, VerificationProgress } from '@/services/EmailVerificationService';
import { FontAwesome } from '@expo/vector-icons';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const { token_hash, type } = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const { session: currentSession, user: currentUser, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Verifica del token...');
  const [verificationProgress, setVerificationProgress] = useState<VerificationProgress | null>(null);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const segments = useSegments();

  useEffect(() => {
    // Registra per aggiornamenti di progresso
    const unsubscribe = emailVerificationService.onProgressUpdate((progress) => {
      setVerificationProgress(progress);
      setMessage(progress.message);
      
      if (progress.stage === 'completed') {
        setVerificationComplete(true);
        setLoading(false);
      } else if (progress.stage === 'failed') {
        setVerificationError(progress.details?.error || 'Verifica fallita');
        setLoading(false);
      }
    });

    const confirmEmail = async () => {
      LoggingService.info('ConfirmEmail', 'STARTING comprehensive email confirmation process', {
        type,
        hasTokenHash: !!token_hash,
        tokenHashLength: token_hash?.length,
        currentSegments: segments,
        currentSession: !!currentSession,
        currentUser: !!currentUser
      });

      if (type !== 'signup' || !token_hash) {
        LoggingService.error('ConfirmEmail', 'Invalid confirmation link', {
          type,
          hasTokenHash: !!token_hash
        });
        setMessage('Link di conferma non valido.');
        setVerificationError('Link di conferma non valido o scaduto');
        setLoading(false);
        return;
      }

      try {
        // STEP 1: Verifica token con il servizio
        const verificationResult = await emailVerificationService.verifyEmailToken(token_hash, type);
        
        if (!verificationResult.success) {
          throw new Error(verificationResult.error || 'Verifica token fallita');
        }

        const { user, session } = verificationResult;
        
        if (!user || !user.email) {
          throw new Error('Dati utente non disponibili dopo la verifica');
        }

        // STEP 2: Crea profilo utente
        const profileResult = await emailVerificationService.createUserProfile(user);
        
        if (!profileResult.success) {
          LoggingService.warning('ConfirmEmail', 'Profile creation failed, but continuing', profileResult.error);
        }

        // STEP 3: Completa autenticazione
        const authResult = await emailVerificationService.completeAuthentication();
        
        if (!authResult.success) {
          throw new Error(authResult.error || 'Completamento autenticazione fallito');
        }

        // STEP 4: Reindirizzamento automatico
        setTimeout(() => {
          LoggingService.info('ConfirmEmail', 'Auto-redirecting to dashboard after successful verification');
          router.replace('/');
        }, 2000);

      } catch (error: any) {
        LoggingService.error('ConfirmEmail', 'COMPREHENSIVE VERIFICATION FAILED', {
          error: error.message,
          errorCode: error.code,
          errorStatus: error.status,
          fullError: error
        });
        
        setVerificationError(error.message || 'Impossibile confermare l\'email');
        setMessage(`Errore: ${error.message || 'Impossibile confermare l\'email.'}`);
        
        setTimeout(() => {
          LoggingService.info('ConfirmEmail', 'Redirecting to login after comprehensive error');
          router.replace('/login');
        }, 5000);
      }
    };

    confirmEmail();
    
    return unsubscribe;
  }, [token_hash, type, currentSession, currentUser, refreshUserProfile, router, segments]);

  const handleRetryVerification = () => {
    setLoading(true);
    setVerificationError(null);
    setVerificationComplete(false);
    setVerificationProgress(null);
    
    // Riavvia il processo di verifica
    LoggingService.info('ConfirmEmail', 'User requested verification retry');
    
    // Forza un nuovo tentativo navigando alla stessa pagina
    router.replace(`/confirm-email?token_hash=${token_hash}&type=${type}`);
  };

  const handleGoToDashboard = () => {
    LoggingService.info('ConfirmEmail', 'User manually navigating to dashboard');
    router.replace('/');
  };

  const handleBackToLogin = () => {
    LoggingService.info('ConfirmEmail', 'User manually returning to login');
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <FontAwesome
          name={verificationComplete ? "check-circle" : verificationError ? "exclamation-triangle" : "cog"}
          size={80}
          color={verificationComplete ? "#28a745" : verificationError ? "#dc3545" : "#007bff"}
          style={styles.icon}
        />
        
        <Text style={styles.title}>
          {verificationComplete ? 'Verifica Completata!' : verificationError ? 'Errore di Verifica' : 'Conferma Email'}
        </Text>
        
        {/* Indicatore di progresso in tempo reale */}
        {verificationProgress && !verificationError && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <FontAwesome name="cog" size={16} color="#007bff" />
              <Text style={styles.progressTitle}>Progresso Verifica</Text>
            </View>
            <Text style={styles.progressMessage}>{verificationProgress.message}</Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${verificationProgress.progress}%` }]}
              />
            </View>
            <Text style={styles.progressPercent}>{verificationProgress.progress}%</Text>
            
            {/* Dettagli tecnici per debugging */}
            {verificationProgress.details && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>Dettagli Tecnici:</Text>
                <Text style={styles.debugText}>
                  Stage: {verificationProgress.stage}{'\n'}
                  Timestamp: {new Date(verificationProgress.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        )}
        
        {/* Messaggio principale */}
        <Text style={[
          styles.message,
          verificationComplete && styles.successMessage,
          verificationError && styles.errorMessage
        ]}>
          {message}
        </Text>
        
        {/* Indicatore di caricamento */}
        {loading && !verificationProgress && (
          <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
        )}
        
        {/* Pulsanti di azione */}
        <View style={styles.actionButtons}>
          {verificationComplete && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToDashboard}>
              <FontAwesome name="home" size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Vai alla Dashboard</Text>
            </TouchableOpacity>
          )}
          
          {verificationError && (
            <>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetryVerification}>
                <FontAwesome name="refresh" size={16} color="#fff" />
                <Text style={styles.retryButtonText}>Riprova Verifica</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToLogin}>
                <FontAwesome name="sign-in" size={16} color="#007bff" />
                <Text style={styles.secondaryButtonText}>Torna al Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Informazioni di supporto */}
        {verificationError && (
          <View style={styles.supportInfo}>
            <Text style={styles.supportTitle}>Hai bisogno di aiuto?</Text>
            <Text style={styles.supportText}>
              • Verifica che il link non sia scaduto{'\n'}
              • Controlla la connessione internet{'\n'}
              • Prova a registrarti nuovamente se il problema persiste
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  progressContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    fontWeight: '500',
  },
  debugInfo: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007bff',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  successMessage: {
    color: '#28a745',
    fontWeight: '500',
  },
  errorMessage: {
    color: '#dc3545',
    fontWeight: '500',
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
  actionButtons: {
    width: '100%',
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  retryButton: {
    backgroundColor: '#ffc107',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007bff',
  },
  secondaryButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  supportInfo: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
