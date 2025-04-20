export type ServiceType = 'gmail' | 'calendar' | 'drive' | 'docs' | 'sheets' | 'people' | 'meet';
export type ScopeLevel = 'readonly' | 'full' | 'send' | 'compose' | 'events' | 'file' | 'create' | 'edit';

export interface PermissionCacheEntry {
    hasAccess: boolean;
    lastChecked: number;
}

export interface ServicePermissions {
    [scope: string]: PermissionCacheEntry;
}

export interface PermissionsState {
    [service: string]: ServicePermissions;
}

export interface TokenInfoResponse {
    tokenInfo: {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
    };
    scopes: {
        [scope: string]: {
            service: string;
            level: string;
        };
    };
}

export interface ServiceAccessResponse {
    service: ServiceType;
    scopeResults: {
        [scope: string]: {
            hasAccess: boolean;
            requiredScope: string;
        };
    };
}

export interface PermissionState {
    accountId: string | null;
    permissionsCache: {
        [accountId: string]: PermissionsState;
    };
    pendingPermissions: {
        [key: string]: boolean;
    };
    isPopupOpen: boolean;
    currentPermissionRequest: {
        service: ServiceType;
        scopes: ScopeLevel[];
        onComplete?: (success: boolean) => void;
    } | null;
}

export interface PermissionContextValue extends PermissionState {
    checkServicePermission: (
        accountId: string,
        service: ServiceType,
        scope: ScopeLevel
    ) => Promise<boolean>;
    requestPermissions: (
        accountId: string,
        service: ServiceType,
        scopes: ScopeLevel[],
        onComplete?: (success: boolean) => void
    ) => Promise<boolean>;
    hasRequiredPermission: (
        accountId: string,
        service: ServiceType,
        scope: ScopeLevel
    ) => boolean;
    invalidatePermission: (
        accountId: string,
        service: ServiceType,
        scope: ScopeLevel
    ) => void;
    clearAccountPermissions: (accountId: string) => void;
}

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