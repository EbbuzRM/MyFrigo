import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '@/services/supabaseClient';
import { LoggingService } from '@/services/LoggingService';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Log di diagnostica spostati e convertiti
  LoggingService.debug('ResetPassword', 'Component MOUNTED');
  LoggingService.debug('ResetPassword', 'Raw params', params);

  const token_hash = params.token_hash || params.token; // Gestione ibrida
  const [diagnosticToken, setDiagnosticToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  LoggingService.info('ResetPassword', 'Parametri ricevuti', params);

  useEffect(() => {
    const handleReset = async () => {
      LoggingService.info('ResetPassword', 'Avvio processo reset', { token_hash });

      if (!token_hash) {
        LoggingService.error('ResetPassword', 'Token mancante');
        setError('Token di reset mancante. Procedura avviata in modo non valido.');
        setDiagnosticToken(null);
        // Non reindirizzare subito, lasciare all'utente la possibilità di tornare indietro
        return;
      }

      try {
        // Mostra una parte del token per diagnostica
        if (typeof token_hash === 'string' && token_hash.length > 6) {
          setDiagnosticToken(token_hash.substring(0, 8) + '...');
        } else if (typeof token_hash === 'string') {
          setDiagnosticToken(token_hash); // Mostra tutto se troppo corto
        }


        // Verifica esplicita del token di recovery
        LoggingService.info('ResetPassword', 'Verifica token', { 
          token_length: token_hash.toString().length,
          token_prefix: token_hash.toString().substring(0, 6)
        });
        
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token_hash.toString(),
          type: 'recovery'
        });

        LoggingService.info('ResetPassword', 'Risposta verifica token', {
          hasUser: !!data?.user,
          error: verifyError?.message
        });

        if (verifyError) {
          throw verifyError; // Lancia l'errore per essere catturato dal blocco catch
        }

        LoggingService.info('ResetPassword', 'Token verificato', {
          user_id: data.user?.id,
          email: data.user?.email
        });

        // attendi che la sessione venga materializzata nello storage prima di navigare
        try {
          const maxAttempts = 6; // ~1.5s totali
          let attempt = 0;
          let sessionEstablished = false;

          const { error: refreshErr } = await supabase.auth.refreshSession();
          if (refreshErr) {
            LoggingService.warning('ResetPassword', 'Refresh session fallito dopo verifyOtp', refreshErr);
          }

          while (attempt < maxAttempts && !sessionEstablished) {
            const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
            if (sessionErr) {
              LoggingService.warning('ResetPassword', 'Errore durante getSession nel polling', sessionErr);
            }

            if (sessionData?.session) {
              sessionEstablished = true;
              LoggingService.info('ResetPassword', 'Sessione stabilita dopo verifyOtp', {
                userId: sessionData.session.user.id,
                expiresAt: sessionData.session.expires_at
              });
              break;
            }
            await new Promise((res) => setTimeout(res, 250));
            attempt++;
          }

          if (!sessionEstablished) {
            LoggingService.warning('ResetPassword', 'Sessione non rilevata dopo verifyOtp; procedo comunque alla schermata di reset');
          }
        } catch (pollErr: unknown) {
          LoggingService.warning('ResetPassword', 'Errore inatteso nel polling della sessione', pollErr);
        }

        router.replace('/password-reset-form');
      } catch (err: unknown) {
        LoggingService.error('ResetPassword', 'Errore verifica token', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        // Non reindirizzare subito, lasciare all'utente la possibilità di tornare indietro
      }
    };

    handleReset();
  }, [token_hash]); // Aggiunto token_hash alle dipendenze

  const handleGoBack = () => {
    router.replace('/forgot-password');
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007bff" />
      <Text style={styles.loadingText}>
        {error ? 'Si è verificato un problema.' : 'Verifica token in corso...'}
      </Text>

      {error && (
        <>
          <Text style={styles.errorText}>{error}</Text>
          {diagnosticToken && (
            <View style={styles.diagnosticBox}>
              <Text style={styles.diagnosticLabel}>Codice diagnostica (opzionale):</Text>
              <Text style={styles.diagnosticValue}>{diagnosticToken}</Text>
              <Text style={styles.diagnosticSubLabel}>(può essere utile per il supporto)</Text>
            </View>
          )}
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>Torna al recupero password</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  diagnosticBox: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
    width: '80%',
  },
  diagnosticLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  diagnosticValue: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#495057',
    fontWeight: 'bold',
    padding: 4,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 3,
  },
  diagnosticSubLabel: {
    fontSize: 10,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
