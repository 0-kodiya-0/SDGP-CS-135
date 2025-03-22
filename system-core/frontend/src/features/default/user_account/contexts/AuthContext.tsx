// feature/default/user_account/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { Session } from '../types/types.data';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    session: Session | null;
    error: string | null;
    logout: (accountId?: string) => Promise<void>;
    logoutAll: () => Promise<void>;
    readSessionToken: () => void;
    switchAccount: (accountId: string) => Promise<boolean>;
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
                selectedAccountId: decodedSession.selectedAccountId, // Add selected account support
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

    // Set up periodic session check
    useEffect(() => {
        const checkSession = () => {
            const updatedSession = readSessionTokenFromCookie();
            if (JSON.stringify(updatedSession) !== JSON.stringify(session)) {
                setSession(updatedSession);
            }
        };

        // Check session every minute
        const intervalId = setInterval(checkSession, 60000);

        return () => clearInterval(intervalId);
    }, [session]);

    // Manual function to read the session token
    const readSessionToken = () => {
        setIsLoading(true);
        const sessionData = readSessionTokenFromCookie();
        setSession(sessionData);
        setIsLoading(false);
        console.log("Session token manually read:", sessionData);
    };

    // Switch to a different account in the same session
    const switchAccount = async (accountId: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            
            if (!session) {
                setError('No active session');
                return false;
            }
            
            // Make a request to the backend to switch accounts
            const response = await fetch(`/api/v1/account/${accountId}/switch`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Read the updated session token with new selected account
                readSessionToken();
                return true;
            } else {
                const errorData = await response.json();
                setError(errorData.error?.message || 'Failed to switch account');
                return false;
            }
        } catch (error) {
            console.error('Account switch failed:', error);
            setError('Failed to switch account');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Logout from a specific account
    const logout = async (accountId?: string) => {
        try {
            setIsLoading(true);
            if (accountId) {
                window.location.href = `/api/v1/account/${accountId}/logout`;
            }
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Failed to logout');
        } finally {
            setIsLoading(false);
        }
    };

    // Logout from all accounts
    const logoutAll = async () => {
        try {
            setIsLoading(true);
            window.location.href = "/api/v1/account/logout/all";
        } catch (error) {
            console.error('Logout all failed:', error);
            setError('Failed to logout from all accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        isAuthenticated: session !== null,
        isLoading,
        session,
        error,
        logout,
        logoutAll,
        readSessionToken,
        switchAccount
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