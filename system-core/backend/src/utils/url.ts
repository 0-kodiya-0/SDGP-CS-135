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

    // Get host from request (respects X-Forwarded-Host header)
    const host = req.get('host');

    // Combine to get full URL
    return `${protocol}://${host}${path}`;
}