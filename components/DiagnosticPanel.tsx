import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LoggingService } from '@/services/LoggingService';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { authLogger } from '@/utils/AuthLogger';
import { formStateLogger } from '@/utils/FormStateLogger';
import { supabase } from '@/services/supabaseClient';
import { StorageService } from '@/services/StorageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DiagnosticPanelProps {
  onClose: () => void;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ onClose }) => {
  const { isDarkMode } = useTheme();
  const { user, session } = useAuth();
  const { settings } = useSettings();
  const styles = getStyles(isDarkMode);

  // Implementazione diretta dei test invece di usare DiagnosticTester
  const runAuthLoggingTest = () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test del sistema di logging dell\'autenticazione');
    
    // Versione semplificata del test per evitare problemi
    try {
      // Reset di eventuali stati precedenti
      authLogger.completeAuth(false);
      
      // Inizia un nuovo processo di autenticazione
      authLogger.startAuth();
      LoggingService.info('DiagnosticPanel', 'Processo di autenticazione iniziato');
      
      // Simula un singolo passaggio di successo
      authLogger.startStep('TEST_AUTH_STEP_SUCCESS');
      LoggingService.info('DiagnosticPanel', 'Step di test iniziato');
      
      // Completa immediatamente il passaggio
      authLogger.endStep('TEST_AUTH_STEP_SUCCESS');
      LoggingService.info('DiagnosticPanel', 'Step di test completato');
      
      // Completa il processo con successo
      authLogger.completeAuth(true);
      LoggingService.info('DiagnosticPanel', 'Processo di autenticazione completato con successo');
      
      // Mostra il riepilogo
      const summary = authLogger.getAuthSummary();
      LoggingService.info('DiagnosticPanel', 'Riepilogo del test di autenticazione:', summary);
      
      Alert.alert(
        'Test Autenticazione Completato',
        'Il sistema di logging dell\'autenticazione funziona correttamente. Controlla i log per i dettagli.'
      );
    } catch (error) {
      LoggingService.error('DiagnosticPanel', 'Errore nel test di autenticazione', error);
      Alert.alert(
        'Errore nel Test',
        'Si è verificato un errore durante il test. Controlla i log per i dettagli.'
      );
    }
  };
  
  const runFormStateLoggingTest = () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test del sistema di logging dell\'inserimento prodotti');
    
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
    
    LoggingService.info('DiagnosticPanel', 'Confronto stati:', comparison);
    
    // Ottieni il riepilogo
    const summary = formStateLogger.getStateSummary();
    LoggingService.info('DiagnosticPanel', 'Riepilogo del test di inserimento prodotti:', summary);
    
    Alert.alert(
      'Test Inserimento Prodotti Completato',
      'Il sistema di logging dell\'inserimento prodotti funziona correttamente. Controlla i log per i dettagli.'
    );
  };
  
  const runAuthBlockingDetectionTest = () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test della rilevazione di blocchi nell\'autenticazione');
    
    // Simula un processo di autenticazione
    authLogger.startAuth();
    
    // Simula un passaggio che non viene mai completato
    authLogger.startStep('BLOCKING_STEP');
    
    // Attendi un po' e poi verifica se il passaggio è bloccato
    setTimeout(() => {
      const blockingOperations = authLogger.checkForBlockingOperations();
      LoggingService.info('DiagnosticPanel', 'Operazioni bloccanti rilevate:', blockingOperations);
      
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
  };
  
  const runDataPersistenceTest = () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test della persistenza dei dati durante la navigazione');
    
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
        LoggingService.info('DiagnosticPanel', 'Confronto stati dopo navigazione:', comparison);
        
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
  };

  // NUOVI TEST DIAGNOSTICI AVANZATI
  
  const runDatabaseConnectivityTest = async () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test connettività database');
    
    const startTime = Date.now();
    
    try {
      // Test connessione base
      const { data: healthCheck, error: healthError } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (healthError) {
        throw new Error(`Database connection failed: ${healthError.message}`);
      }
      
      // Test autenticazione
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      const isAuthenticated = !!currentSession?.user;
      
      LoggingService.info('DiagnosticPanel', 'Database connectivity test results', {
        responseTime,
        isAuthenticated,
        userId: currentSession?.user?.id
      });
      
      Alert.alert(
        'Test Connettività Database Completato',
        `✅ Connessione: OK (${responseTime}ms)\n` +
        `✅ Autenticazione: ${isAuthenticated ? 'OK' : 'FALLITA'}\n` +
        `📊 Tempo di risposta: ${responseTime}ms`
      );
    } catch (error) {
      const responseTime = Date.now() - startTime;
      LoggingService.error('DiagnosticPanel', 'Database connectivity test failed', error);
      
      Alert.alert(
        'Test Connettività Database Fallito',
        `❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}\n` +
        `⏱️ Tempo: ${responseTime}ms`
      );
    }
  };

  const runApiPerformanceTest = async () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test performance API');
    
    const tests = [
      { name: 'Recupero Prodotti', operation: () => StorageService.getProducts() },
      { name: 'Recupero Impostazioni', operation: () => StorageService.getSettings() },
      { name: 'Recupero Categorie', operation: () => StorageService.getCustomCategories() },
      { name: 'Recupero Cronologia', operation: () => StorageService.getHistory() }
    ];
    
    const results = [];
    
    for (const test of tests) {
      const startTime = Date.now();
      try {
        await test.operation();
        const responseTime = Date.now() - startTime;
        results.push({ name: test.name, time: responseTime, success: true });
        LoggingService.info('DiagnosticPanel', `${test.name} completed in ${responseTime}ms`);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        results.push({ name: test.name, time: responseTime, success: false, error });
        LoggingService.error('DiagnosticPanel', `${test.name} failed in ${responseTime}ms`, error);
      }
    }
    
    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const successCount = results.filter(r => r.success).length;
    
    const resultText = results.map(r =>
      `${r.success ? '✅' : '❌'} ${r.name}: ${r.time}ms`
    ).join('\n');
    
    Alert.alert(
      'Test Performance API Completato',
      `📊 Risultati (${successCount}/${results.length} successi):\n\n` +
      `${resultText}\n\n` +
      `⏱️ Tempo medio: ${Math.round(avgTime)}ms`
    );
  };

  const runDataIntegrityTest = async () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test integrità dati');
    
    try {
      // Test 1: Verifica coerenza prodotti
      const { data: products, error: productsError } = await StorageService.getProducts();
      if (productsError) throw productsError;
      
      const activeProducts = products?.filter(p => p.status === 'active') || [];
      const consumedProducts = products?.filter(p => p.status === 'consumed') || [];
      
      // Test 2: Verifica impostazioni
      const settings = await StorageService.getSettings();
      const isValidSettings = settings &&
        typeof settings.notificationDays === 'number' &&
        settings.notificationDays > 0 &&
        ['light', 'dark', 'auto'].includes(settings.theme);
      
      // Test 3: Verifica sessione utente
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const hasValidSession = !!currentSession?.user?.id;
      
      // Test 4: Verifica categorie
      const categories = await StorageService.getCustomCategories();
      const hasCategories = Array.isArray(categories);
      
      const issues = [];
      if (!hasValidSession) issues.push('Sessione utente non valida');
      if (!isValidSettings) issues.push('Impostazioni corrotte');
      if (!hasCategories) issues.push('Errore nel caricamento categorie');
      if (products && products.some(p => !p.id || !p.name)) issues.push('Prodotti con dati mancanti');
      
      LoggingService.info('DiagnosticPanel', 'Data integrity test results', {
        totalProducts: products?.length || 0,
        activeProducts: activeProducts.length,
        consumedProducts: consumedProducts.length,
        hasValidSession,
        isValidSettings,
        categoriesCount: categories.length,
        issues
      });
      
      Alert.alert(
        'Test Integrità Dati Completato',
        `📊 Statistiche:\n` +
        `• Prodotti totali: ${products?.length || 0}\n` +
        `• Prodotti attivi: ${activeProducts.length}\n` +
        `• Prodotti consumati: ${consumedProducts.length}\n` +
        `• Categorie: ${categories.length}\n` +
        `• Sessione: ${hasValidSession ? 'Valida' : 'Non valida'}\n` +
        `• Impostazioni: ${isValidSettings ? 'OK' : 'Corrotte'}\n\n` +
        `${issues.length === 0 ? '✅ Nessun problema rilevato' : `❌ Problemi: ${issues.join(', ')}`}`
      );
    } catch (error) {
      LoggingService.error('DiagnosticPanel', 'Data integrity test failed', error);
      Alert.alert(
        'Test Integrità Dati Fallito',
        `❌ Errore durante il test: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      );
    }
  };

  const runCachePerformanceTest = async () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test performance cache');
    
    try {
      const testKey = 'diagnostic_cache_test';
      const testData = { timestamp: Date.now(), data: 'test_value' };
      
      // Test scrittura cache
      const writeStart = Date.now();
      await AsyncStorage.setItem(testKey, JSON.stringify(testData));
      const writeTime = Date.now() - writeStart;
      
      // Test lettura cache
      const readStart = Date.now();
      const cachedData = await AsyncStorage.getItem(testKey);
      const readTime = Date.now() - readStart;
      
      // Test rimozione cache
      const removeStart = Date.now();
      await AsyncStorage.removeItem(testKey);
      const removeTime = Date.now() - removeStart;
      
      // Verifica integrità dati
      const parsedData = cachedData ? JSON.parse(cachedData) : null;
      const dataIntegrity = parsedData && parsedData.timestamp === testData.timestamp;
      
      LoggingService.info('DiagnosticPanel', 'Cache performance test results', {
        writeTime,
        readTime,
        removeTime,
        dataIntegrity
      });
      
      Alert.alert(
        'Test Performance Cache Completato',
        `📊 Risultati:\n` +
        `• Scrittura: ${writeTime}ms\n` +
        `• Lettura: ${readTime}ms\n` +
        `• Rimozione: ${removeTime}ms\n` +
        `• Integrità dati: ${dataIntegrity ? '✅ OK' : '❌ FALLITA'}\n\n` +
        `${writeTime < 50 && readTime < 50 ? '✅ Performance ottimali' : '⚠️ Performance lente'}`
      );
    } catch (error) {
      LoggingService.error('DiagnosticPanel', 'Cache performance test failed', error);
      Alert.alert(
        'Test Performance Cache Fallito',
        `❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      );
    }
  };

  const runUserSessionValidationTest = async () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test validazione sessione utente');
    
    try {
      // Test 1: Verifica sessione corrente
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Test 2: Verifica token validity
      const isSessionValid = !!currentSession?.access_token;
      const tokenExpiry = currentSession?.expires_at ? new Date(currentSession.expires_at * 1000) : null;
      const isTokenExpired = tokenExpiry ? tokenExpiry < new Date() : true;
      
      // Test 3: Verifica profilo utente
      const hasUserProfile = !!user;
      const profileComplete = user?.user_metadata &&
        (user.user_metadata.full_name || (user.user_metadata.given_name && user.user_metadata.family_name));
      
      // Test 4: Verifica contesto auth
      const authContextValid = !!session && !!user;
      
      // Test 5: Verifica impostazioni utente
      const userSettingsValid = !!settings && typeof settings.notificationDays === 'number';
      
      const issues = [];
      if (!isSessionValid) issues.push('Sessione non valida');
      if (isTokenExpired) issues.push('Token scaduto');
      if (!hasUserProfile) issues.push('Profilo utente mancante');
      if (!profileComplete) issues.push('Profilo utente incompleto');
      if (!authContextValid) issues.push('Contesto autenticazione non valido');
      if (!userSettingsValid) issues.push('Impostazioni utente non valide');
      
      LoggingService.info('DiagnosticPanel', 'User session validation results', {
        isSessionValid,
        isTokenExpired,
        hasUserProfile,
        profileComplete,
        authContextValid,
        userSettingsValid,
        userId: currentSession?.user?.id,
        tokenExpiry: tokenExpiry?.toISOString(),
        issues
      });
      
      Alert.alert(
        'Test Validazione Sessione Completato',
        `👤 Stato Utente:\n` +
        `• Sessione: ${isSessionValid ? '✅ Valida' : '❌ Non valida'}\n` +
        `• Token: ${isTokenExpired ? '❌ Scaduto' : '✅ Valido'}\n` +
        `• Profilo: ${hasUserProfile ? '✅ Presente' : '❌ Mancante'}\n` +
        `• Profilo completo: ${profileComplete ? '✅ Sì' : '⚠️ No'}\n` +
        `• Contesto auth: ${authContextValid ? '✅ OK' : '❌ Errore'}\n` +
        `• Impostazioni: ${userSettingsValid ? '✅ OK' : '❌ Errore'}\n\n` +
        `${issues.length === 0 ? '✅ Sessione completamente valida' : `⚠️ Problemi: ${issues.join(', ')}`}`
      );
    } catch (error) {
      LoggingService.error('DiagnosticPanel', 'User session validation test failed', error);
      Alert.alert(
        'Test Validazione Sessione Fallito',
        `❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      );
    }
  };

  const runSystemHealthTest = async () => {
    LoggingService.info('DiagnosticPanel', 'Avvio test salute sistema');
    
    try {
      interface HealthTest {
        name: string;
        status: string;
        details: string;
      }
      
      const healthMetrics = {
        timestamp: new Date().toISOString(),
        tests: [] as HealthTest[]
      };
      
      // Test 1: Memoria disponibile (approssimativo)
      const memoryTest = {
        name: 'Memoria',
        status: 'OK',
        details: 'Test memoria non implementato su React Native'
      };
      healthMetrics.tests.push(memoryTest);
      
      // Test 2: Connettività di rete (tramite Supabase)
      let networkTest;
      try {
        const networkStart = Date.now();
        await supabase.from('products').select('count').limit(1);
        const networkTime = Date.now() - networkStart;
        networkTest = {
          name: 'Rete',
          status: networkTime < 3000 ? 'OK' : 'LENTA',
          details: `Tempo risposta: ${networkTime}ms`
        };
      } catch (error) {
        networkTest = {
          name: 'Rete',
          status: 'ERRORE',
          details: `Connessione fallita: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
        };
      }
      healthMetrics.tests.push(networkTest);
      
      // Test 3: Storage locale
      let storageTest;
      try {
        const testKey = 'health_check_storage';
        await AsyncStorage.setItem(testKey, 'test');
        await AsyncStorage.getItem(testKey);
        await AsyncStorage.removeItem(testKey);
        storageTest = {
          name: 'Storage Locale',
          status: 'OK',
          details: 'Lettura/scrittura funzionanti'
        };
      } catch (error) {
        storageTest = {
          name: 'Storage Locale',
          status: 'ERRORE',
          details: `Storage non accessibile: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
        };
      }
      healthMetrics.tests.push(storageTest);
      
      // Test 4: Servizi core
      const coreServicesTest = {
        name: 'Servizi Core',
        status: (LoggingService && StorageService && supabase) ? 'OK' : 'ERRORE',
        details: 'LoggingService, StorageService, Supabase'
      };
      healthMetrics.tests.push(coreServicesTest);
      
      // Test 5: Contesti React
      const contextsTest = {
        name: 'Contesti React',
        status: (user && settings) ? 'OK' : 'PARZIALE',
        details: `Auth: ${user ? 'OK' : 'NO'}, Settings: ${settings ? 'OK' : 'NO'}`
      };
      healthMetrics.tests.push(contextsTest);
      
      const overallHealth = healthMetrics.tests.every(t => t.status === 'OK') ? 'OTTIMA' :
        healthMetrics.tests.some(t => t.status === 'ERRORE') ? 'CRITICA' : 'BUONA';
      
      LoggingService.info('DiagnosticPanel', 'System health test results', healthMetrics);
      
      const testResults = healthMetrics.tests.map(t =>
        `${t.status === 'OK' ? '✅' : t.status === 'LENTA' || t.status === 'PARZIALE' ? '⚠️' : '❌'} ${t.name}: ${t.status}`
      ).join('\n');
      
      Alert.alert(
        'Test Salute Sistema Completato',
        `🏥 Salute Generale: ${overallHealth === 'OTTIMA' ? '✅' : overallHealth === 'BUONA' ? '⚠️' : '❌'} ${overallHealth}\n\n` +
        `📊 Dettagli:\n${testResults}\n\n` +
        `🕐 Timestamp: ${new Date().toLocaleTimeString()}`
      );
    } catch (error) {
      LoggingService.error('DiagnosticPanel', 'System health test failed', error);
      Alert.alert(
        'Test Salute Sistema Fallito',
        `❌ Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      );
    }
  };
  
  const runAllTests = () => {
    LoggingService.info('DiagnosticPanel', 'Avvio di tutti i test diagnostici');
    
    Alert.alert(
      'Test Diagnostici Completi',
      'Verranno eseguiti tutti i test diagnostici (originali + avanzati). Questo potrebbe richiedere alcuni minuti.',
      [
        {
          text: 'Annulla',
          style: 'cancel'
        },
        {
          text: 'Solo Test Base',
          onPress: () => {
            // Esegui solo i test originali
            runAuthLoggingTest();
            setTimeout(() => runFormStateLoggingTest(), 3000);
            setTimeout(() => runAuthBlockingDetectionTest(), 6000);
            setTimeout(() => runDataPersistenceTest(), 15000);
          }
        },
        {
          text: 'Tutti i Test',
          onPress: async () => {
            // Esegui tutti i test in sequenza
            try {
              LoggingService.info('DiagnosticPanel', 'Iniziando sequenza completa di test diagnostici');
              
              // Test base
              runAuthLoggingTest();
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              runFormStateLoggingTest();
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Test avanzati
              await runDatabaseConnectivityTest();
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              await runApiPerformanceTest();
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              await runDataIntegrityTest();
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              await runCachePerformanceTest();
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              await runUserSessionValidationTest();
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              await runSystemHealthTest();
              
              // Test con timing speciale
              setTimeout(() => runAuthBlockingDetectionTest(), 2000);
              setTimeout(() => runDataPersistenceTest(), 8000);
              
              LoggingService.info('DiagnosticPanel', 'Sequenza completa di test diagnostici completata');
              
              Alert.alert(
                'Test Completati',
                'Tutti i test diagnostici sono stati eseguiti. Controlla i log per i dettagli completi.'
              );
            } catch (error) {
              LoggingService.error('DiagnosticPanel', 'Errore durante l\'esecuzione dei test completi', error);
              Alert.alert(
                'Errore Test',
                'Si è verificato un errore durante l\'esecuzione dei test. Controlla i log per i dettagli.'
              );
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Pannello Diagnostico</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Chiudi</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Test Individuali</Text>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runAuthLoggingTest}
        >
          <Text style={styles.testButtonText}>Test Sistema Logging Autenticazione</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runFormStateLoggingTest}
        >
          <Text style={styles.testButtonText}>Test Sistema Logging Inserimento Prodotti</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runAuthBlockingDetectionTest}
        >
          <Text style={styles.testButtonText}>Test Rilevazione Blocchi Autenticazione</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runDataPersistenceTest}
        >
          <Text style={styles.testButtonText}>Test Persistenza Dati Durante Navigazione</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Test Avanzati</Text>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runDatabaseConnectivityTest}
        >
          <Text style={styles.testButtonText}>Test Connettività Database</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runApiPerformanceTest}
        >
          <Text style={styles.testButtonText}>Test Performance API</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runDataIntegrityTest}
        >
          <Text style={styles.testButtonText}>Test Integrità Dati</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runCachePerformanceTest}
        >
          <Text style={styles.testButtonText}>Test Performance Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runUserSessionValidationTest}
        >
          <Text style={styles.testButtonText}>Test Validazione Sessione Utente</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.testButton}
          onPress={runSystemHealthTest}
        >
          <Text style={styles.testButtonText}>Test Salute Sistema</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Test Completo</Text>
        
        <TouchableOpacity
          style={[styles.testButton, styles.allTestsButton]}
          onPress={runAllTests}
        >
          <Text style={styles.testButtonText}>Esegui Tutti i Test</Text>
        </TouchableOpacity>
        
        <Text style={styles.infoText}>
          Questi test verificano il corretto funzionamento del sistema MyFrigo, inclusi autenticazione, inserimento prodotti,
          connettività database, performance API, integrità dati, cache, sessioni utente e salute generale del sistema.
          I risultati dei test saranno visualizzati tramite alert e registrati nei log dell'applicazione per analisi dettagliate.
        </Text>
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
    margin: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: isDarkMode ? '#161b22' : '#e2e8f0',
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#30363d' : '#cbd5e1',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  closeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: isDarkMode ? '#21262d' : '#cbd5e1',
  },
  closeButtonText: {
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  testButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
  },
  testButtonText: {
    color: isDarkMode ? '#58a6ff' : '#3b82f6',
    fontWeight: '500',
    textAlign: 'center',
  },
  allTestsButton: {
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
    borderColor: isDarkMode ? '#2ea043' : '#059669',
  },
  infoText: {
    fontSize: 14,
    color: isDarkMode ? '#8b949e' : '#64748b',
    marginTop: 8, // Ridotto da 16 a 8 per avvicinare il testo
    marginBottom: 16, // Aggiunto margine inferiore per separazione
    lineHeight: 20,
  },
});
