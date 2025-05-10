export interface TokenInfo {
    accessToken: string;
    refreshToken?: string;
    scope: string;
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