// googlePermissionUtils.ts
import { API_BASE_URL } from "../../../../conf/axios";

// Types for permission handling
export interface PermissionInfo {
    permissionUrl: string;
    redirectUrl: string;
    accountId: string;
}

export interface RequiredPermission {
    service: string;
    scopeLevel: string;
    requiredScope?: string;
    permissionInfo: PermissionInfo;
}

export interface PermissionError {
    code: string;
    message: string | { requiredPermission?: RequiredPermission; permissionInfo?: PermissionInfo; };
}

/**
 * Check if an error is a permission error from Google API
 */
export function isPermissionError(error: any): boolean {
    // Check if the error contains permission information
    if (!error?.response?.data?.error) return false;

    const apiError = error.response.data.error;

    return (
        apiError.code === 'INSUFFICIENT_SCOPE' ||
        apiError.code === 'PERMISSION_DENIED' ||
        apiError.message && typeof apiError.message === 'object' && (
            apiError.message.requiredPermission !== undefined ||
            apiError.message.permissionInfo !== undefined
        )
    );
}

/**
 * Handle errors from Google API requests
 * Returns a permission error object if it's a permission error, null otherwise
 */
export function handleApiError(error: any): PermissionError | null {
    // Check if this is a permission error
    if (!isPermissionError(error)) {
        return null;
    }

    // Extract error information
    const errorResponse = error.response?.data?.error;

    if (!errorResponse) {
        return null;
    }

    // Return the permission error
    return {
        code: errorResponse.code,
        message: errorResponse.message
    };
}

/**
 * Redirect to Google permission page to request access
 */
export function requestPermission(permissionError: PermissionError): void {
    // Extract permission info from the error
    let permission: RequiredPermission | null = null;

    if (permissionError && typeof permissionError.message === 'object') {
        if (permissionError.message.requiredPermission) {
            permission = permissionError.message.requiredPermission;
        } else if (permissionError.message.permissionInfo) {
            permission = {
                service: 'unknown',
                scopeLevel: 'unknown',
                permissionInfo: permissionError.message.permissionInfo
            };
        }
    }

    if (!permission) {
        console.error('Permission info missing, cannot request permission');
        return;
    }

    const { permissionInfo, service, scopeLevel } = permission;

    if (!permissionInfo) {
        console.error('Permission info missing, cannot request permission');
        return;
    }

    // Construct the permission URL
    const { permissionUrl, redirectUrl, accountId } = permissionInfo;

    // Build the URL to request permissions
    let requestUrl = permissionUrl;

    // If we have service and scopeLevel information, include it in the URL
    if (service !== 'unknown' && scopeLevel !== 'unknown') {
        requestUrl = `${permissionUrl}/${service}/${scopeLevel}`;
    }

    // Add query parameters
    requestUrl = `${requestUrl}?redirectUrl=${encodeURIComponent(redirectUrl)}&accountId=${accountId}`;

    // Redirect to the permission request page
    window.location.href = requestUrl;
}

/**
 * Create a permission error object for insufficient permissions
 */
export function createPermissionError(
    service: string,
    scopeLevel: string,
    accountId: string
): PermissionError {
    return {
        code: "INSUFFICIENT_SCOPE",
        message: {
            requiredPermission: {
                service,
                scopeLevel,
                permissionInfo: {
                    permissionUrl: `${API_BASE_URL}/oauth/permission`,
                    redirectUrl: window.location.pathname,
                    accountId
                }
            }
        }
    };
}