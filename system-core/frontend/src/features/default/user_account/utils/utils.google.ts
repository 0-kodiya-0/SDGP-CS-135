// googlePermissionUtils.ts
import { API_BASE_URL } from "../../../../conf/axios";
import { ScopeLevel } from "../types/types.google.api";

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

export function createPermissionError(
    service: string, 
    scopeLevel: ScopeLevel | ScopeLevel[], 
    accountId: string
): PermissionError {
    // Get base URL for permission requests
    const baseUrl =  `${API_BASE_URL}/oauth/permission`;
    
    // Create permission info object
    const permissionInfo: PermissionInfo = {
        permissionUrl: baseUrl,
        redirectUrl: window.location.href,
        accountId
    };
    
    // Create required permission object
    let requiredPermission: RequiredPermission;
    
    if (Array.isArray(scopeLevel)) {
        // For multiple scopes, join them with commas
        requiredPermission = {
            service,
            scopeLevel: scopeLevel.join(','),
            permissionInfo
        };
    } else {
        requiredPermission = {
            service,
            scopeLevel,
            permissionInfo
        };
    }
    
    // Return error with required permission info
    return new Error(JSON.stringify({ requiredPermission })) as unknown as PermissionError;
}

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
    } else if (permissionError && typeof permissionError.message === 'string') {
        try {
            const errorData = JSON.parse(permissionError.message);
            permission = errorData.requiredPermission;
        } catch (e) {
            console.error('Error parsing permission error message:', e);
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
        // Support comma-separated scope levels for multiple scopes
        requestUrl = `${permissionUrl}/${service}/${scopeLevel}`;
    }

    // Add query parameters
    requestUrl = `${requestUrl}?redirectUrl=${encodeURIComponent(redirectUrl)}&accountId=${accountId}`;

    // Redirect to the permission request page
    window.location.href = requestUrl;
}