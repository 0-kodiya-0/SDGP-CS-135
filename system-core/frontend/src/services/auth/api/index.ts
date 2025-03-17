import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true, // Important for cookies
});

// Intercept 401 responses to handle token expiration
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 (Unauthorized) and we haven't already tried to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Extract the account ID from the URL if present
            const urlParts = originalRequest.url.split('/');
            const accountIdIndex = urlParts.indexOf('account') + 1;

            if (accountIdIndex > 0 && accountIdIndex < urlParts.length) {
                const accountId = urlParts[accountIdIndex];

                try {
                    // Try to refresh the token
                    const response = await axios.post(`/api/v1/account/${accountId}/refresh`);

                    if (response.data.success) {
                        // Retry the original request
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);

                    // Redirect to login if refresh fails
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export const authApi = {
    loginWithGoogle: async () => {
        try {
            // This will redirect to Google's OAuth page
            window.location.href = '/api/v1/oauth/signin/google';
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    signupWithGoogle: async () => {
        try {
            // This will redirect to Google's OAuth page
            window.location.href = '/api/v1/oauth/signup/google';
        } catch (error) {
            console.error('Signup failed:', error);
            throw error;
        }
    },

    logout: async (accountId?: string) => {
        if (accountId) {
            return api.post(`/oauth/${accountId}/logout`);
        } else {
            return api.post('/oauth/logout/all');
        }
    },

    refreshToken: async (accountId: string) => {
        return api.post(`/account/${accountId}/refresh`);
    },

    getAccounts: async () => {
        return api.get('/accounts');
    }
};

export const accountApi = {
    getAccountDetails: async (accountId: string) => {
        return api.get(`/account/${accountId}`);
    },

    updateAccount: async (accountId: string, updates: any) => {
        return api.patch(`/account/${accountId}`, updates);
    }
};

export default api;