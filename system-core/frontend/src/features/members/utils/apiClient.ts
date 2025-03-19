// utils/apiClient.ts
import axios from 'axios';

// Create an axios instance with default config
export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies are sent with requests for session-based auth
  withCredentials: true,
});

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle error cases
    if (error.response) {
      // Session expired or not authenticated
      if (error.response.status === 401) {
        // Redirect to login page
        window.location.href = '/login';
      }
      
      // Handle other error statuses if needed
      if (error.response.status === 403) {
        console.error('Permission denied:', error.response.data);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;