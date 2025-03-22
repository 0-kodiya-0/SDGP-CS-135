// session.types.ts
export interface AccountSession {
    accountId: string;
    accountType: string;
    provider?: string;
    // Token information stored for the account
    tokenInfo?: {
        accessToken: string;
        expiresAt: number; // Timestamp when the token expires
        scope?: string;    // The scopes this token has access to
    };
}

export interface SessionPayload {
    sessionId: string;
    accounts: AccountSession[];
    selectedAccountId?: string; // Track the currently selected account
    createdAt: number;
    expiresAt: number; // We'll set this to a far future date
}

export interface RefreshTokenData {
    id: string;
    accountId: string;
    token: string;
    createdAt: string;
    expiresAt: string;
    isRevoked: boolean;
}

// Interface to track sessions in the database
export interface SessionTrackingData {
    sessionId: string;
    userId: string;       // The user this session belongs to
    userAgent?: string;   // Browser/device information
    ipAddress?: string;   // IP address when session was created
    createdAt: string;    // When the session was created
    lastActivity: string; // Last time this session was used
    isActive: boolean;    // Whether this session is still active
}