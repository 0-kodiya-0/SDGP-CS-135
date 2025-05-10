import { apiService } from '../../common/services/api';

// Background script that runs in the background when the plugin is active
// This can handle tasks like data syncing, notifications, etc.

// Initialize the background service
export function initialize() {
    console.log('Background script initialized');

    // Set up any listeners or background tasks
    const intervalId = setInterval(async () => {
        try {
            // Example: Periodically fetch and process data
            const data = await apiService.getData();
            console.log('Background data update:', data);

            // Could trigger notifications or other actions based on data
        } catch (error) {
            console.error('Background task error:', error);
        }
    }, 300000); // Every 5 minutes

    // Return cleanup function
    return {
        destroy: () => {
            console.log('Background script cleanup');
            clearInterval(intervalId);
        }
    };
}