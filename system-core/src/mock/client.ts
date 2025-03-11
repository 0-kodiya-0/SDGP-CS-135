import axios, { AxiosInstance } from 'axios';
import { ErrorResponse } from './types/client';
import API_CONFIG from './config';
import { setupMockApi } from './mock';

// Create Axios instance
const api: AxiosInstance = axios.create(API_CONFIG);

api.interceptors.request.use((config) => {
    // const { accessToken } = useApiStore.getState();
    // if (accessToken) {
    //     config.headers.Authorization = `Bearer ${accessToken}`;
    // }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // if (error.response?.status === 401) {
        //     const apiStore = useApiStore.getState();
        //     apiStore.clearTokens();
        // }
        const errorResponse: ErrorResponse = {
            message: error.response?.data?.message || 'An unexpected error occurred',
            code: error.code,
            status: error.response?.status,
        };
        return Promise.reject(errorResponse);
    }
);

setupMockApi(api);

// Export instance for custom usage
export { api };