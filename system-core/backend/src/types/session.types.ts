export interface AccountSession {
    accountId: string;
    accountType: string;
    provider?: string;
    // email field removed for security
}

export interface SessionPayload {
    sessionId: string;
    accounts: AccountSession[];
    createdAt: number;
    expiresAt: number;
}

export interface RefreshTokenData {
    id: string;
    accountId: string;
    token: string;
    createdAt: string;
    expiresAt: string;
    isRevoked: boolean;
}