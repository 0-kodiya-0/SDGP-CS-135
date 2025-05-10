import { Request } from "express";

/**
 * Helper function to build absolute URLs that work behind proxies
 * @param req Express request object
 * @param path Relative path to convert to absolute URL
 * @returns Full URL with protocol, host and path
 */
export function getAbsoluteUrl(req: Request, path: string): string {
    // Get protocol from request (respects X-Forwarded-Proto header)
    const protocol = req.protocol;

    // Get host, properly respecting X-Forwarded-Host header if present
    const host = req.get('X-Forwarded-Host') || req.get('host');

    // Combine to get full URL
    return `${protocol}://${host}/api/v1${path}`;
}

export function removeRootUrl(url: string) {
    const segments = url.split('/').filter(segment => segment);
    segments.shift(); // Remove root segment

    // Handle query parameters manually
    const queryIndex = url.indexOf('?');
    const queryString = queryIndex !== -1 ? url.substring(queryIndex) : '';

    return '/' + segments.join('/') + queryString;
}