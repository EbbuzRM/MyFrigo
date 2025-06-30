import * as TaskManager from 'expo-task-manager';
import { TaskManagerTaskResult } from 'expo-task-manager';
import { StorageService } from './StorageService';

const BACKGROUND_SYNC_TASK = 'background-sync';

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('Starting background sync...');
    // Fetch products to sync data. The actual data is handled by the StorageService listener.
    // This just ensures we are connecting to Firestore in the background.
    await StorageService.getProducts(); 
    console.log('Background sync completed successfully.');
    return TaskManager.TaskManagerTaskResult.Success;
  } catch (error) {
    console.error('Background sync task failed:', error);
    return TaskManager.TaskManagerTaskResult.Failure;
  }
});

export const registerBackgroundSync = async () => {
  try {
    // This is a placeholder for the registration logic which will be added to _layout.tsx
    // The actual registration needs to be done using the BackgroundTask module.
    console.log('Background sync task defined.');
  } catch (error) {
    console.error('Failed to define background sync task:', error);
  }
};
