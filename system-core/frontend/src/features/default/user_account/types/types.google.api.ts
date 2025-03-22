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
    scopeLevel: string;
    hasAccess: boolean;
    requiredScope: string;
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
        scopeLevel: string
    ) => Promise<ServiceAccessResponse | null>;
    
    // New token management functions
    refreshToken: (accountId: string) => Promise<boolean>;
    
    // Session management
    getSessions: (accountId: string) => Promise<SessionInfo[] | null>;
    terminateOtherSessions: (accountId: string) => Promise<boolean>;
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