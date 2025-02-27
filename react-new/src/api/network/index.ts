import { NetworkApi } from './networkCore';

// Export types for external use
export * from './types';

// Create a default instance
const networkApi = new NetworkApi();

// Main export is the default instance
export default networkApi;

// Also export the NetworkApi class for creating custom instances
export { NetworkApi };