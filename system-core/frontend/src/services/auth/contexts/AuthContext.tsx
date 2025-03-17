import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export interface Account {
    accountId: string;
    accountType: string;
    provider?: string;
    email?: string;
    name?: string;
    imageUrl?: string;
}

interface Session {
    sessionId: string;
    accounts: Account[];
    createdAt?: number;
    expiresAt?: number;
    iat?: number;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    session: Session | null;
    error: string | null;
    refreshTokens: (accountId: string) => Promise<boolean>;
    logout: (accountId?: string) => Promise<void>;
    logoutAll: () => Promise<void>;
    // Manual function to read session token
    readSessionToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to read and decode the session token cookie
const readSessionTokenFromCookie = (): Session | null => {
    try {
        const sessionCookie = Cookies.get('session_token');

        if (!sessionCookie) {
            console.log("No session_token cookie found");
            return null;
        }

        try {
            // Decode the JWT token
            const decodedSession = jwtDecode<Session>(sessionCookie);
            console.log("Successfully decoded session:", decodedSession);

            return {
                sessionId: decodedSession.sessionId,
                accounts: decodedSession.accounts || [],
                createdAt: decodedSession.createdAt,
                expiresAt: decodedSession.expiresAt,
                iat: decodedSession.iat
            };
        } catch (decodeError) {
            console.error('Failed to decode session cookie:', decodeError);
            return null;
        }
    } catch (err) {
        console.error('Session retrieval failed:', err);
        return null;
    }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Read the session token immediately during component initialization
    const initialSession = readSessionTokenFromCookie();
    console.log("Initial session on load:", initialSession);

    const [isLoading, setIsLoading] = useState(false);
    const [session, setSession] = useState<Session | null>(initialSession);
    const [error, setError] = useState<string | null>(null);

    // Manual function to read the session token
    const readSessionToken = () => {
        setIsLoading(true);
        const sessionData = readSessionTokenFromCookie();
        setSession(sessionData);
        setIsLoading(false);
        console.log("Session token manually read:", sessionData);
    };

    // Refresh tokens for a specific account
    const refreshTokens = async (accountId: string): Promise<boolean> => {
        try {
            const response = await axios.post(`/api/v1/account/${accountId}/refresh`);

            if (response.data.success) {
                // Re-read the session token after refresh
                readSessionToken();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    };

    // Logout from a specific account
    const logout = async (accountId?: string) => {
        try {
            if (accountId) {
                await axios.post(`/api/v1/oauth/${accountId}/logout`);

                // Update local session state by removing the account
                if (session) {
                    const updatedAccounts = session.accounts.filter(
                        account => account.accountId !== accountId
                    );

                    if (updatedAccounts.length === 0) {
                        setSession(null);
                    } else {
                        setSession({
                            ...session,
                            accounts: updatedAccounts
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Failed to logout');
        }
    };

    // Logout from all accounts
    const logoutAll = async () => {
        try {
            await axios.post('/api/v1/oauth/logout/all');
            setSession(null);
        } catch (error) {
            console.error('Logout all failed:', error);
            setError('Failed to logout from all accounts');
        }
    };

    const value = {
        // Important change: Check for the existence of session instead of session?.authenticated
        isAuthenticated: session !== null,
        isLoading,
        session,
        error,
        refreshTokens,
        logout,
        logoutAll,
        readSessionToken
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};