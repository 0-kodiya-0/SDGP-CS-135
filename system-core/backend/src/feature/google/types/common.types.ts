// Pagination parameters for list requests
export interface PaginationParams {
    pageToken?: string;
    maxResults?: number;
}

// Base response for list requests
export interface GoogleListResponse<T> {
    items: T[];
    nextPageToken?: string;
}

// Error response from Google APIs
export interface GoogleApiError {
    code: number;
    message: string;
    status: string;
    details?: any;
}

// Extended Request interface to include Google auth data
import { Request } from 'express';
import { Auth } from 'googleapis';

export interface GoogleApiRequest extends Request {
    googleAuth?: Auth.OAuth2Client;
    params: {
        accountId: string;
        [key: string]: string;
    };
}

// Base Google API response for our API
export interface GoogleServiceResponse<T> {
    data: T;
    metadata?: {
        nextPageToken?: string;
        totalResults?: number;
    };
}