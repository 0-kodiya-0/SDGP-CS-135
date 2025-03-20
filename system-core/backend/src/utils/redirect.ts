import { Response, Request } from "express";
import { ApiErrorCode } from "../types/response.types";

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
    // Create a URL object for proper handling of parameters
    const url = new URL(baseUrl.startsWith('http') ? baseUrl : `http://localhost:8080${baseUrl}`);
    const pathname = url.pathname;
    const isAbsoluteUrl = baseUrl.startsWith('http');

    // Add status parameter
    url.searchParams.append('status', options.type);

    // Add code and message for errors
    if (options.type === RedirectType.ERROR && options.code) {
        url.searchParams.append('errorCode', options.code);

        if (options.message) {
            url.searchParams.append('errorMessage', encodeURIComponent(options.message));
        }
    }

    // Add data for success
    if (options.type === RedirectType.SUCCESS && options.data) {
        url.searchParams.append('data', encodeURIComponent(JSON.stringify(options.data)));
    }

    // For permission redirects, include original URL
    if (options.type === RedirectType.PERMISSION && originalUrl) {
        url.searchParams.append('redirectAfterPermission', encodeURIComponent(originalUrl));
    }

    // Return properly formatted URL
    return isAbsoluteUrl ? url.toString() : `${pathname}${url.search}`;
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
    data?: Record<string, any>
): void => {
    handleRedirect(res, path, {
        path,
        type: RedirectType.SUCCESS,
        data
    });
};

/**
 * Redirect on error
 */
export const redirectWithError = (
    res: Response,
    path: string,
    code: ApiErrorCode,
    message?: string
): void => {
    handleRedirect(res, path, {
        path,
        type: RedirectType.ERROR,
        code,
        message
    });
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