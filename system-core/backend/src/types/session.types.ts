export interface AccountSession {
    accountId: string;
    accountType: string;
    provider?: string;
    email?: string;
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