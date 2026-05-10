// UpdateService.notifications.ts — UpdateService.notifications module.
//
// exports: UpdateEventEmitter | UpdateNotificationService
// used_by: services\UpdateService.ts
// rules:   - The `UpdateEventEmitter` is the single event bus for the module; all inter-component communication must go through it, not direct function calls between unrelated services.
//          - Event names used in `UpdateNotificationService` are the canonical set; adding new event types requires explicit cross-module coordination with `UpdateService.ts`.
//          - Static methods on `UpdateNotificationService` must remain the only way to emit update-related events externally.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

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
