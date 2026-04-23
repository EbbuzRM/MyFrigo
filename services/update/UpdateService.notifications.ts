import { UpdateInfo } from './UpdateService.metadata';

type UpdateEventListener = (data: UpdateInfo | null) => void;
const updateListeners: { [key: string]: UpdateEventListener[] } = {};

export const UpdateEventEmitter = {
  on(event: string, listener: UpdateEventListener) {
    if (!updateListeners[event]) {
      updateListeners[event] = [];
    }
    updateListeners[event].push(listener);
    return () => {
      updateListeners[event] = updateListeners[event].filter(l => l !== listener);
    };
  },

  emit(event: string, data?: UpdateInfo | null) {
    if (updateListeners[event]) {
      updateListeners[event].forEach(listener => listener(data || null));
    }
  },

  removeAllListeners(event: string) {
    if (updateListeners[event]) {
      updateListeners[event] = [];
      return true;
    }
    return false;
  }
};

export class UpdateNotificationService {
  static notifyUpdateChecked(info: UpdateInfo) {
    UpdateEventEmitter.emit('updateChecked', info);
  }

  static notifyUpdateError(info: UpdateInfo) {
    UpdateEventEmitter.emit('updateError', info);
  }

  static notifyUpdateDownloaded(info: UpdateInfo) {
    UpdateEventEmitter.emit('updateDownloaded', info);
  }

  static notifyDownloadError() {
    UpdateEventEmitter.emit('downloadError', null);
  }

  static notifyAppRestarting() {
    UpdateEventEmitter.emit('appRestarting', null);
  }

  static notifyRestartError() {
    UpdateEventEmitter.emit('restartError', null);
  }
}
