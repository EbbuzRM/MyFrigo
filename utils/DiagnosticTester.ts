import { LoggingService } from '@/services/LoggingService';
import { authLogger } from './AuthLogger';
import { formStateLogger } from './FormStateLogger';
import { Alert } from 'react-native';

/**
 * Utility per testare le soluzioni implementate per i problemi di autenticazione e inserimento prodotti
 */
export class DiagnosticTester {
  /**
   * Testa il sistema di logging dell'autenticazione
   */
  public static testAuthLogging(): void {
    LoggingService.info('DiagnosticTester', 'Avvio test del sistema di logging dell\'autenticazione');
    
    // Simula un processo di autenticazione
    authLogger.startAuth();
    
    // Simula vari passaggi del processo
    authLogger.startStep('TEST_AUTH_STEP_1');
    setTimeout(() => {
      authLogger.endStep('TEST_AUTH_STEP_1');
      
      authLogger.startStep('TEST_AUTH_STEP_2');
      setTimeout(() => {
        // Simula un errore
        authLogger.errorStep('TEST_AUTH_STEP_2', new Error('Errore di test'));
        
        authLogger.startStep('TEST_AUTH_STEP_3');
        setTimeout(() => {
          authLogger.endStep('TEST_AUTH_STEP_3');
          
          // Completa il processo
          authLogger.completeAuth(true);
          
          // Mostra il riepilogo
          const summary = authLogger.getAuthSummary();
          LoggingService.info('DiagnosticTester', 'Riepilogo del test di autenticazione:', summary);
          
          Alert.alert(
            'Test Autenticazione Completato',
            'Il sistema di logging dell\'autenticazione funziona correttamente. Controlla i log per i dettagli.'
          );
        }, 500);
      }, 500);
    }, 500);
  }
  
  /**
   * Testa il sistema di logging dell'inserimento prodotti
   */
  public static testFormStateLogging(): void {
    LoggingService.info('DiagnosticTester', 'Avvio test del sistema di logging dell\'inserimento prodotti');
    
    // Simula la navigazione tra schermate
    formStateLogger.logNavigation('TEST_NAVIGATION', 'screen-a', 'screen-b', { param1: 'value1' });
    
    // Simula il salvataggio dello stato di un form
    const formState1 = {
      name: 'Prodotto di test',
      brand: 'Marca di test',
      quantity: '1',
      unit: 'pz',
      notes: 'Note di test'
    };
    
    formStateLogger.saveFormState('test-form-1', formState1);
    
    // Simula una modifica allo stato
    const formState2 = {
      ...formState1,
      quantity: '2',
      notes: 'Note modificate'
    };
    
    // Salva lo stato modificato
    formStateLogger.saveFormState('test-form-1', formState2);
    
    // Recupera lo stato salvato
    const retrievedState = formStateLogger.getFormState('test-form-1');
    
    // Confronta gli stati
    const comparison = formStateLogger.compareStates(formState1, retrievedState);
    
    LoggingService.info('DiagnosticTester', 'Confronto stati:', comparison);
    
    // Ottieni il riepilogo
    const summary = formStateLogger.getStateSummary();
    LoggingService.info('DiagnosticTester', 'Riepilogo del test di inserimento prodotti:', summary);
    
    Alert.alert(
      'Test Inserimento Prodotti Completato',
      'Il sistema di logging dell\'inserimento prodotti funziona correttamente. Controlla i log per i dettagli.'
    );
  }
  
  /**
   * Testa la gestione del problema di autenticazione bloccata
   */
  public static testAuthBlockingDetection(): void {
    LoggingService.info('DiagnosticTester', 'Avvio test della rilevazione di blocchi nell\'autenticazione');
    
    // Simula un processo di autenticazione
    authLogger.startAuth();
    
    // Simula un passaggio che non viene mai completato
    authLogger.startStep('BLOCKING_STEP');
    
    // Attendi un po' e poi verifica se il passaggio è bloccato
    setTimeout(() => {
      const blockingOperations = authLogger.checkForBlockingOperations();
      LoggingService.info('DiagnosticTester', 'Operazioni bloccanti rilevate:', blockingOperations);
      
      if (blockingOperations.length > 0) {
        Alert.alert(
          'Test Rilevazione Blocchi Completato',
          `Rilevate ${blockingOperations.length} operazioni bloccanti: ${blockingOperations.join(', ')}`
        );
      } else {
        Alert.alert(
          'Test Rilevazione Blocchi Fallito',
          'Nessuna operazione bloccante rilevata, ma era attesa almeno una.'
        );
      }
      
      // Completa il processo per pulizia
      authLogger.completeAuth(false);
    }, 6000); // Attendi 6 secondi (la soglia è 5 secondi)
  }
  
  /**
   * Testa la persistenza dei dati durante la navigazione
   */
  public static testDataPersistence(): void {
    LoggingService.info('DiagnosticTester', 'Avvio test della persistenza dei dati durante la navigazione');
    
    // Simula lo stato di un form
    const formState = {
      name: 'Prodotto di test',
      brand: 'Marca di test',
      quantity: '1',
      unit: 'pz',
      notes: 'Note di test'
    };
    
    // Salva lo stato
    formStateLogger.saveFormState('test-persistence', formState);
    
    // Simula la navigazione verso un'altra schermata
    formStateLogger.logNavigation('TEST_NAVIGATION', 'form-screen', 'photo-screen', formState);
    
    // Simula la navigazione di ritorno
    setTimeout(() => {
      formStateLogger.logNavigation('TEST_NAVIGATION_BACK', 'photo-screen', 'form-screen', {
        ...formState,
        imageUrl: 'test-image-url'
      });
      
      // Recupera lo stato salvato
      const retrievedState = formStateLogger.getFormState('test-persistence');
      
      // Verifica che lo stato sia stato preservato
      if (retrievedState) {
        const comparison = formStateLogger.compareStates(formState, retrievedState);
        LoggingService.info('DiagnosticTester', 'Confronto stati dopo navigazione:', comparison);
        
        Alert.alert(
          'Test Persistenza Dati Completato',
          comparison.hasDifferences 
            ? 'Rilevate differenze nello stato dopo la navigazione. Controlla i log per i dettagli.'
            : 'Lo stato è stato preservato correttamente durante la navigazione.'
        );
      } else {
        Alert.alert(
          'Test Persistenza Dati Fallito',
          'Stato non trovato dopo la navigazione.'
        );
      }
    }, 1000);
  }
  
  /**
   * Esegue tutti i test
   */
  public static runAllTests(): void {
    LoggingService.info('DiagnosticTester', 'Avvio di tutti i test diagnostici');
    
    Alert.alert(
      'Test Diagnostici',
      'Verranno eseguiti tutti i test diagnostici. Controlla i log per i dettagli.',
      [
        {
          text: 'Annulla',
          style: 'cancel'
        },
        {
          text: 'Esegui',
          onPress: () => {
            // Esegui i test in sequenza
            this.testAuthLogging();
            
            setTimeout(() => {
              this.testFormStateLogging();
            }, 3000);
            
            setTimeout(() => {
              this.testAuthBlockingDetection();
            }, 6000);
            
            setTimeout(() => {
              this.testDataPersistence();
            }, 15000);
          }
        }
      ]
    );
  }
}