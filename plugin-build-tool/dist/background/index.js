// src/background/index.js
export const setupBackground = () => {
    console.log('Background tasks initialized');
    // Example of a background task: Polling data every 5 seconds
    setInterval(() => {
        console.log('Syncing data in the background...');
        // Logic for background task, e.g., data synchronization
    }, 5000);
    // Another background task: Handle events or triggers
    window.addEventListener('message', (event) => {
        if (event.origin === 'https://your-expected-origin.com') {
            console.log('Message received:', event.data);
        }
        else {
            console.warn('Untrusted message origin:', event.origin);
        }
    });
};
