import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { LoggingService } from '@/services/LoggingService';

export default function EmailSentScreen() {
  const router = useRouter();
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<'sending' | 'sent' | 'delivered' | 'failed'>('sent');

  useEffect(() => {
    // Simula il controllo dello stato di consegna email
    const checkEmailDelivery = async () => {
      setEmailDeliveryStatus('sending');
      
      // Simula controllo di consegna
      setTimeout(() => {
        setEmailDeliveryStatus('delivered');
        LoggingService.info('EmailSent', 'Email delivery confirmed');
      }, 2000);
    };

    checkEmailDelivery();
  }, []);

  const handleBackToLogin = () => {
    LoggingService.info('EmailSent', 'User manually returned to login');
    router.replace('/login');
  };

  const getDeliveryStatusIcon = () => {
    switch (emailDeliveryStatus) {
      case 'sending':
        return <ActivityIndicator size="small" color="#007bff" />;
      case 'sent':
        return <FontAwesome name="paper-plane" size={16} color="#ffc107" />;
      case 'delivered':
        return <FontAwesome name="check-circle" size={16} color="#28a745" />;
      case 'failed':
        return <FontAwesome name="exclamation-triangle" size={16} color="#dc3545" />;
    }
  };

  const getDeliveryStatusText = () => {
    switch (emailDeliveryStatus) {
      case 'sending':
        return 'Invio email in corso...';
      case 'sent':
        return 'Email inviata';
      case 'delivered':
        return 'Email consegnata';
      case 'failed':
        return 'Invio fallito';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <FontAwesome name="envelope" size={80} color="#007bff" style={styles.icon} />
          
          <Text style={styles.title}>Controlla la tua Email</Text>
          
          {/* Indicatore di stato consegna email */}
          <View style={styles.deliveryStatus}>
            {getDeliveryStatusIcon()}
            <Text style={styles.deliveryStatusText}>{getDeliveryStatusText()}</Text>
          </View>
          
          <Text style={styles.message}>
            Ti abbiamo inviato un link di conferma all'indirizzo email che hai fornito.
          </Text>
          
          <Text style={styles.instructions}>
            1. Apri la tua app email{'\n'}
            2. Cerca l'email da MyFrigo{'\n'}
            3. Clicca sul link di conferma{'\n'}
            4. Torna all'app e fai il login
          </Text>
          
          <View style={styles.importantNote}>
            <FontAwesome name="info-circle" size={20} color="#007bff" />
            <Text style={styles.importantNoteText}>
              Dopo aver confermato l'email, torna qui e fai il login per accedere all'app.
            </Text>
          </View>
          
          <Text style={styles.note}>
            Non hai ricevuto l'email? Controlla la cartella spam o prova a registrarti nuovamente.
          </Text>
          
          <TouchableOpacity style={styles.button} onPress={handleBackToLogin}>
            <Text style={styles.buttonText}>Vai al Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deliveryStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  message: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  instructions: {
    fontSize: 16,
    color: '#555',
    textAlign: 'left',
    marginBottom: 20,
    lineHeight: 22,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    width: '100%',
  },
  importantNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  importantNoteText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  note: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});