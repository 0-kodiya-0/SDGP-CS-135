/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosRequestConfig} from 'axios';
import { HttpProvider, NetworkApiOptions } from '../types';

/**
 * Implementation of the HTTP provider using axios
 */
export class AxiosHttpProvider implements HttpProvider {
    private defaultInstance: AxiosInstance;
    private customInstances: Map<string, AxiosInstance> = new Map();

    /**
     * Create a new HttpProvider
     */
    constructor(options: NetworkApiOptions = {}) {
        this.defaultInstance = axios.create({
            baseURL: options.baseUrl,
            timeout: options.timeout || 30000,
            headers: options.headers || {
                'Content-Type': 'application/json',
            },
            withCredentials: options.withCredentials || false,
        });

        // Add request interceptor for logging or modifying requests
        this.defaultInstance.interceptors.request.use(
            (config) => {
                // You can modify the request here before it's sent
                return config;
            },
            (error) => {
                // Handle request errors
                return Promise.reject(error);
            }
        );

        // Add response interceptor for common error handling
        this.defaultInstance.interceptors.response.use(
            (response) => {
                // Process successful responses
                return response;
            },
            (error) => {
                // Handle common error cases
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Response error:', error.response.status, error.response.data);
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error('Request error:', error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Error:', error.message);
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Register a custom axios instance with a unique identifier
     * @param id Unique identifier for the axios instance
     * @param instance Custom axios instance
     * @returns true if registration was successful
     */
    registerInstance(id: string, instance: AxiosInstance): boolean {
        if (this.customInstances.has(id)) {
            console.warn(`Axios instance with id "${id}" already exists. It will be overwritten.`);
        }
        this.customInstances.set(id, instance);
        return true;
    }

    /**
     * Get an axios instance by its id, or the default instance if no id is provided
     * @param id Unique identifier for the axios instance
     * @returns The requested axios instance
     */
    getInstance(id?: string): AxiosInstance {
        if (id && this.customInstances.has(id)) {
            return this.customInstances.get(id)!;
        }
        return this.defaultInstance;
    }

    /**
     * Remove a custom axios instance
     * @param id Unique identifier for the axios instance
     * @returns true if removal was successful
     */
    unregisterInstance(id: string): boolean {
        return this.customInstances.delete(id);
    }

    /**
     * Perform a GET request
     * @param url URL to request
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async get<T = any>(url: string, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        const instance = this.getInstance(instanceId);
        const response = await instance.get<T>(url, config);
        return response.data;
    }

    /**
     * Perform a POST request
     * @param url URL to request
     * @param data Data to send
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        const instance = this.getInstance(instanceId);
        const response = await instance.post<T>(url, data, config);
        return response.data;
    }

    /**
     * Perform a PUT request
     * @param url URL to request
     * @param data Data to send
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        const instance = this.getInstance(instanceId);
        const response = await instance.put<T>(url, data, config);
        return response.data;
    }

    /**
     * Perform a PATCH request
     * @param url URL to request
     * @param data Data to send
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        const instance = this.getInstance(instanceId);
        const response = await instance.patch<T>(url, data, config);
        return response.data;
    }

    /**
     * Perform a DELETE request
     * @param url URL to request
     * @param config Additional axios config
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async delete<T = any>(url: string, config?: AxiosRequestConfig, instanceId?: string): Promise<T> {
        const instance = this.getInstance(instanceId);
        const response = await instance.delete<T>(url, config);
        return response.data;
    }

    /**
     * Generic method to perform any HTTP request
     * @param config Axios request configuration
     * @param instanceId Optional ID of the axios instance to use
     * @returns Promise resolving to the response data
     */
    async request<T = any>(config: AxiosRequestConfig, instanceId?: string): Promise<T> {
        const instance = this.getInstance(instanceId);
        const response = await instance.request<T>(config);
        return response.data;
    }

    /**
     * Set default headers for all requests in the default axios instance
     * @param headers Headers to set
     */
    setDefaultHeaders(headers: Record<string, string>): void {
        Object.entries(headers).forEach(([key, value]) => {
            this.defaultInstance.defaults.headers.common[key] = value;
        });
    }

    /**
     * Set up authentication for requests in the default axios instance
     * @param token Authentication token
     * @param scheme Authentication scheme (default: 'Bearer')
     */
    setAuthToken(token: string, scheme: string = 'Bearer'): void {
        this.defaultInstance.defaults.headers.common['Authorization'] = `${scheme} ${token}`;
    }

    /**
     * Clear authentication token from the default axios instance
     */
    clearAuthToken(): void {
        delete this.defaultInstance.defaults.headers.common['Authorization'];
    }

    /**
     * Setup automatic retry logic for failed requests on the default instance
     * @param maxRetries Maximum number of retry attempts
     * @param retryDelay Base delay between retries in milliseconds
     */
    setupRetry(maxRetries: number = 3, retryDelay: number = 1000): void {
        this.defaultInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const config = error.config;

                // Only retry on network errors or 5xx status codes
                const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status < 600);

                if (!config || !shouldRetry) {
                    return Promise.reject(error);
                }

                // Create retry count if it doesn't exist
                config.__retryCount = config.__retryCount || 0;

                // Check if we've maxed out the retries
                if (config.__retryCount >= maxRetries) {
                    return Promise.reject(error);
                }

                // Increase the retry count
                config.__retryCount += 1;

                // Create a delay with exponential backoff
                const delay = retryDelay * Math.pow(2, config.__retryCount - 1);

                // Return a promise that resolves after the delay and retries the request
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(this.defaultInstance(config));
                    }, delay);
                });
            }
        );
    }
}