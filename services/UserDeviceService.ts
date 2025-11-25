import { supabase } from './supabaseClient';
import { LoggingService } from './LoggingService';

export class UserDeviceService {

  /**
   * Aggiunge o aggiorna un dispositivo per un utente specifico.
   * Utilizza l'operazione di upsert per evitare duplicati.
   * @param userId L'ID dell'utente.
   * @param deviceId L'ID del dispositivo fornito da OneSignal.
   */
  static async addDevice(userId: string, deviceId: string): Promise<void> {
    if (!userId || !deviceId) {
      LoggingService.warning('UserDeviceService', 'UserId or DeviceId is missing, skipping addDevice.');
      return;
    }

    try {
      LoggingService.info('UserDeviceService', `Adding device ${deviceId.substring(0, 8)}... for user ${userId}`);

      const { error } = await supabase
        .from('user_devices')
        .upsert(
          {
            user_id: userId,
            device_id: deviceId,
          },
          {
            onConflict: 'user_id, device_id', // In caso di conflitto su questa coppia, non fare nulla
          }
        );

      if (error) {
        throw error;
      }

      LoggingService.info('UserDeviceService', `Device ${deviceId.substring(0, 8)}... added successfully for user ${userId}`);
    } catch (error) {
      LoggingService.error('UserDeviceService', 'Error adding device for user', { userId, error });
      throw error;
    }
  }

  /**
   * Rimuove un dispositivo specifico per un utente.
   * @param userId L'ID dell'utente.
   * @param deviceId L'ID del dispositivo da rimuovere.
   */
  static async removeDevice(userId: string, deviceId: string): Promise<void> {
    if (!userId || !deviceId) {
      LoggingService.warning('UserDeviceService', 'UserId or DeviceId is missing, skipping removeDevice.');
      return;
    }
    
    try {
      LoggingService.info('UserDeviceService', `Removing device ${deviceId.substring(0, 8)}... for user ${userId}`);

      const { error } = await supabase
        .from('user_devices')
        .delete()
        .eq('user_id', userId)
        .eq('device_id', deviceId);

      if (error) {
        throw error;
      }

      LoggingService.info('UserDeviceService', `Device ${deviceId.substring(0, 8)}... removed successfully for user ${userId}`);
    } catch (error) {
      LoggingService.error('UserDeviceService', 'Error removing device for user', { userId, error });
      throw error;
    }
  }
}
