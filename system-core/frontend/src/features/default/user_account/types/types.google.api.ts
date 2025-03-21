// Types for token info
export interface TokenInfoResponse {
    tokenInfo: {
        audience: string;
        expiresIn: string;
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
        };
    };
}

export interface ServiceAccessResponse {
    service: string;
    scopeLevel: string;
    hasAccess: boolean;
    requiredScope: string;
}

export interface UseTokenApiReturn {
    tokenInfo: TokenInfoResponse | null;
    serviceAccess: ServiceAccessResponse | null;
    loading: boolean;
    error: string | null;
    getTokenInfo: (accountId: string) => Promise<TokenInfoResponse | null>;
    checkServiceAccess: (
        accountId: string,
        service: string,
        scopeLevel: string
    ) => Promise<ServiceAccessResponse | null>;
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