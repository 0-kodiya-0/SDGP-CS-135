export interface AccountSession {
    accountId: string;
    accountType: string;
    provider?: string;
    // Token information stored for the account
    tokenInfo?: {
        accessToken: string;
        scope?: string;    // The scopes this token has access to
    };
}

export interface SessionPayload {
    sessionId: string;
    accounts: string[];
    createdAt: number;
    expiresAt: number; // We'll set this to a far future date
}