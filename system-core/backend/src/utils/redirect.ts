import { Response, Request } from "express";
import { ApiErrorCode } from "../types/response.types";
import * as path from "path";

// Redirect types
export enum RedirectType {
    SUCCESS = 'success',
    ERROR = 'error',
    PERMISSION = 'permission'
}

// Interface for redirect options
export interface RedirectOptions {
    path: string;
    type: RedirectType;
    code?: ApiErrorCode;
    message?: string;
    data?: Record<string, any>;
    preserveQueryParams?: boolean;
}

/**
 * Creates a redirect URL with proper parameters
 */
export const createRedirectUrl = (
    baseUrl: string,
    options: RedirectOptions,
    originalUrl?: string
): string => {
    let finalUrl = '';
    const queryParams = new URLSearchParams();
    
    // Check if it's an absolute URL (starts with http:// or https://)
    const isAbsoluteUrl = baseUrl.startsWith('http://') || baseUrl.startsWith('https://');
    
    if (isAbsoluteUrl) {
        // For absolute URLs, we can use the URL constructor
        try {
            const urlObj = new URL(baseUrl);
            finalUrl = urlObj.origin + urlObj.pathname;
            
            // Copy existing query parameters if any
            urlObj.searchParams.forEach((value, key) => {
                queryParams.append(key, value);
            });
        } catch (error) {
            console.error('Error parsing absolute URL:', error);
            finalUrl = baseUrl;
        }
    } else {
        // For relative URLs (including '../' notation), just use the path directly
        // We'll normalize it to handle '../' paths correctly
        finalUrl = path.normalize(baseUrl).split('?')[0];
        
        // Extract any existing query parameters
        const queryIndex = baseUrl.indexOf('?');
        if (queryIndex !== -1) {
            const queryString = baseUrl.substring(queryIndex + 1);
            new URLSearchParams(queryString).forEach((value, key) => {
                queryParams.append(key, value);
            });
        }
    }
    
    // Add status parameter
    queryParams.append('status', options.type);
    
    // Add code and message for errors
    if (options.type === RedirectType.ERROR && options.code) {
        queryParams.append('errorCode', options.code);
        
        if (options.message) {
            queryParams.append('errorMessage', encodeURIComponent(options.message));
        }
    }
    
    // Add data for success
    if (options.type === RedirectType.SUCCESS && options.data) {
        queryParams.append('data', encodeURIComponent(JSON.stringify(options.data)));
    }
    
    // For permission redirects, include original URL
    if (originalUrl) {
        queryParams.append('redirectUrl', encodeURIComponent(path.normalize(originalUrl)));
    }
    
    // Construct the final URL with query parameters
    const queryString = queryParams.toString();
    if (queryString) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + queryString;
    }
    
    return finalUrl;
};

/**
 * Handle redirects with proper status and parameters
 */
export const handleRedirect = (
    res: Response,
    baseUrl: string,
    options: RedirectOptions,
    originalUrl?: string
): void => {
    const redirectUrl = createRedirectUrl(baseUrl, options, originalUrl);
    res.redirect(redirectUrl);
};

/**
 * Redirect on success
 */
export const redirectWithSuccess = (
    res: Response,
    path: string,
    originalUrl?: string,
    data?: Record<string, any>,
): void => {
    handleRedirect(res, path, {
        path,
        type: RedirectType.SUCCESS,
        data
    }, originalUrl);
};

/**
 * Redirect on error
 */
export const redirectWithError = (
    res: Response,
    path: string,
    code: ApiErrorCode,
    originalUrl?: string,
    message?: string
): void => {
    handleRedirect(res, path, {
        path,
        type: RedirectType.ERROR,
        code,
        message
    }, originalUrl);
};

/**
 * Extract frontend redirect URL from request query parameters
 * With fallback to default URL
 */
export const getRedirectUrl = (req: Request, defaultUrl: string): string => {
    const redirectUrl = req.query.redirectUrl as string;

    // Validate the URL to prevent open redirects
    if (redirectUrl && (
        redirectUrl.startsWith('/') ||
        redirectUrl.startsWith(process.env.PROXY_URL || '')
    )) {
        return redirectUrl;
    }

    return defaultUrl;
};