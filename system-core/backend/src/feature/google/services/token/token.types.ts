export interface TokenInfo {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    scope: string;
    email?: string;
    verified?: boolean;
}

export interface TokenScopeInfo {
    granted: {
        scope: string;
        service: string;
        level: string;
    }[];
    serviceAccess: {
        gmail: boolean;
        calendar: boolean;
        drive: boolean;
        people: boolean;
        meet: boolean;
        [key: string]: boolean;
    };
}