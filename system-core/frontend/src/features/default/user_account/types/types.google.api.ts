// types.google.api.ts - Enhanced with new token endpoints
export interface TokenInfoResponse {
    tokenInfo: {
        expiresAt: string;
        expiresIn: number;
        email: string;
        verified: boolean;
    };
    scopes: {
        granted: Array<{
            scope: string;
            service: string;
            level: string;
        }>;
        serviceAccess: {
            gmail: boolean;
            calendar: boolean;
            drive: boolean;
            people: boolean;
            meet: boolean;
            [key: string]: boolean;
        };
    };
}

export interface ServiceAccessResponse {
    service: string;
    scopeResults : Record<string, { hasAccess: boolean, requiredScope: string }>;
}

export interface SessionInfo {
    sessionId: string;
    createdAt: string;
    lastActivity: string;
    userAgent: string;
    isCurrent: boolean;
}

export interface RefreshTokenResponse {
    success: boolean;
    expiresAt: string;
    expiresIn: number;
}

export interface SessionsResponse {
    sessions: SessionInfo[];
    currentSessionId: string;
}

export interface TerminateSessionsResponse {
    success: boolean;
    terminatedSessionsCount: number;
}

export interface UseTokenApiReturn {
    tokenInfo: TokenInfoResponse | null;
    serviceAccess: ServiceAccessResponse | null;
    loading: boolean;
    error: string | null;

    // Token info and permissions
    getTokenInfo: (accountId: string) => Promise<TokenInfoResponse | null>;
    checkServiceAccess: (
        accountId: string,
        service: string,
        scopeLevel: ScopeLevel[]
    ) => Promise<ServiceAccessResponse | null>;

    // New token management functions
    refreshToken: (accountId: string) => Promise<boolean>;

    // // Session management
    // getSessions: (accountId: string) => Promise<SessionInfo[] | null>;
    // terminateOtherSessions: (accountId: string) => Promise<boolean>;
}

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

// Enhanced permission scope types with service-specific scope levels
export type ServiceType = "gmail" | "calendar" | "drive" | "sheets" | "docs" | "meet" | "people";

// Base scope levels that apply across services
export type BaseScope = "readonly" | "full";

// Gmail-specific scope levels
export type GmailScope = BaseScope | "send" | "compose";

// Calendar-specific scope levels
export type CalendarScope = BaseScope | "event" | "addonly";

// Drive-specific scope levels
export type DriveScope = BaseScope | "file" | "metadata" | "appdata";

// Sheets & Docs specific scope levels
export type DocsScope = BaseScope | "create" | "edit";

// People-specific scope levels
export type PeopleScope = BaseScope | "contacts" | "directory";

// Meet-specific scope levels
export type MeetScope = BaseScope | "schedule" | "join";

// Union type of all possible scopes
export type ScopeLevel = GmailScope | CalendarScope | DriveScope | DocsScope | PeopleScope | MeetScope;

// Generic interface for service permissions that handles any scope type
// Generic interface for service permissions that handles any scope type
export type ServicePermissions = {
    [scope in ScopeLevel]?: { hasAccess: boolean; };
};

export interface PermissionCacheEntry {
    hasAccess: boolean;
    lastChecked: number;
}

export interface ServiceCache {
    [scope: string]: PermissionCacheEntry;
}

export interface AccountCache {
    [service: string]: ServiceCache;
}

export interface PermissionCache {
    [accountId: string]: AccountCache;
}

export interface UseServicePermissionsReturn {
    // Permission states
    permissions?: ServicePermissions;
    permissionsLoading: boolean;
    permissionError: string | null;

    // Functions
    checkAllServicePermissions: () => Promise<void>;
    hasRequiredPermission: (requiredScope: ScopeLevel) => boolean;
    invalidateServicePermission: (scope: ScopeLevel) => void;

    // Service information
    availableScopes: ScopeLevel[];
}