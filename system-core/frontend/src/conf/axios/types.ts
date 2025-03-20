// Configuration
export const API_BASE_URL = import.meta.env.REACT_APP_API_BASE_URL || '/api/v1';

// Type for the API response
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

export interface ErrorResponse {
    message: string;
    code?: string;
    status?: number;
}