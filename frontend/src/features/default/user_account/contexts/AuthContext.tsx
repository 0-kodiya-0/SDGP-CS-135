import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccountStore } from '../store/account.store';
import { useNavigate } from 'react-router-dom';
import { OAuthProviders } from '../types/types.data';
import axios from 'axios';
import { API_BASE_URL } from '../../../../conf/axios';
import { LocalAuthAPI } from '../api/localAuth.api';
import { LocalLoginRequest, LocalSignupRequest } from '../types/types.localAuth.api';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    logout: (accountId: string) => Promise<void>;
    logoutAll: () => Promise<void>;
    tokenRevocation: (accountId: string, provider: OAuthProviders) => void;

    // Local auth methods
    localLogin: (data: LocalLoginRequest) => Promise<{
        success: boolean;
        requiresTwoFactor?: boolean;
        tempToken?: string;
        accountId?: string;
        error?: string;
    }>;
    localSignup: (data: LocalSignupRequest) => Promise<{
        success: boolean;
        accountId?: string;
        error?: string;
    }>;
    verifyTwoFactor: (tempToken: string, code: string) => Promise<{
        success: boolean;
        accountId?: string;
        error?: string;
    }>;
    requestPasswordReset: (email: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
    resetPassword: (token: string, password: string, confirmPassword: string) => Promise<{
        success: boolean;
        error?: string;
    }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    // Use the account store instead of state
    const { accountIds, hasAccounts, clearAccounts, removeAccount, addAccount } = useAccountStore();

    // Complete initial loading after component mounts
    useEffect(() => {
        setIsLoading(false);
    }, []);

    // Logout from a specific account
    const logout = async (accountId: string) => {
        try {
            setIsLoading(true);

            // Use direct axios instead of window.location.href
            await axios({
                url: `${API_BASE_URL}/account/logout`,
                method: 'GET',
                params: { accountId },
                withCredentials: true
            });

            removeAccount(accountId);
            navigate('/accounts');
        } catch (error) {
            console.error('Logout failed:', error);
            setError('Failed to logout');
        } finally {
            setIsLoading(false);
        }
    };

    // Updated logoutAll function
    const logoutAll = async () => {
        try {
            setIsLoading(true);

            // Use direct axios instead of window.location.href
            await axios.get(`${API_BASE_URL}/account/logout/all`, {
                params: { accountIds },
                paramsSerializer: () => {
                    const searchParams = new URLSearchParams();
                    accountIds.forEach(id => searchParams.append('accountIds', id));
                    return searchParams.toString();
                },
                withCredentials: true
            });
            clearAccounts();
            navigate('/accounts');
        } catch (error) {
            console.error('Logout all failed:', error);
            setError('Failed to logout from all accounts');
        } finally {
            setIsLoading(false);
        }
    };

    const tokenRevocation = (accountId: string, provider: OAuthProviders) => {
        navigate(`/app/${accountId}/revoke?provider=${provider}`);
    };

    // Local Authentication Methods

    const localLogin = async (data: LocalLoginRequest) => {
        try {
            console.log('[AuthContext] Attempting local login for:', data.email || data.username);

            const response = await LocalAuthAPI.login(data);

            if (response.success && response.data) {
                if (response.data.requiresTwoFactor && response.data.tempToken) {
                    // 2FA required
                    console.log('[AuthContext] 2FA required for login');
                    return {
                        success: true,
                        requiresTwoFactor: true,
                        tempToken: response.data.tempToken,
                        accountId: response.data.accountId
                    };
                } else if (response.data.accountId) {
                    // Success - add account to store
                    console.log('[AuthContext] Local login successful, account:', response.data.accountId);
                    addAccount(response.data.accountId);
                    return {
                        success: true,
                        accountId: response.data.accountId
                    };
                }
            }

            // Login failed
            console.log('[AuthContext] Local login failed:', response.error?.message);
            return {
                success: false,
                error: response.error?.message || 'Login failed'
            };
        } catch (error) {
            console.error('[AuthContext] Local login error:', error);
            return {
                success: false,
                error: 'Network error during login'
            };
        }
    };

    const localSignup = async (data: LocalSignupRequest) => {
        try {
            console.log('[AuthContext] Attempting local signup for:', data.email);

            const response = await LocalAuthAPI.signup(data);

            if (response.success && response.data) {
                console.log('[AuthContext] Local signup successful');
                return {
                    success: true,
                    accountId: response.data.accountId
                };
            }

            // Signup failed
            console.log('[AuthContext] Local signup failed:', response.error?.message);
            return {
                success: false,
                error: response.error?.message || 'Signup failed'
            };
        } catch (error) {
            console.error('[AuthContext] Local signup error:', error);
            return {
                success: false,
                error: 'Network error during signup'
            };
        }
    };

    const verifyTwoFactor = async (tempToken: string, code: string) => {
        try {
            console.log('[AuthContext] Verifying 2FA code');

            const response = await LocalAuthAPI.verifyTwoFactor({
                token: code,
                tempToken
            });

            if (response.success && response.data?.accountId) {
                console.log('[AuthContext] 2FA verification successful, account:', response.data.accountId);
                addAccount(response.data.accountId);
                return {
                    success: true,
                    accountId: response.data.accountId
                };
            }

            console.log('[AuthContext] 2FA verification failed:', response.error?.message);
            return {
                success: false,
                error: response.error?.message || '2FA verification failed'
            };
        } catch (error) {
            console.error('[AuthContext] 2FA verification error:', error);
            return {
                success: false,
                error: 'Network error during 2FA verification'
            };
        }
    };

    const requestPasswordReset = async (email: string) => {
        try {
            console.log('[AuthContext] Requesting password reset for:', email);

            const response = await LocalAuthAPI.requestPasswordReset({ email });

            if (response.success) {
                console.log('[AuthContext] Password reset request successful');
                return { success: true };
            }

            console.log('[AuthContext] Password reset request failed:', response.error?.message);
            return {
                success: false,
                error: response.error?.message || 'Password reset request failed'
            };
        } catch (error) {
            console.error('[AuthContext] Password reset request error:', error);
            return {
                success: false,
                error: 'Network error during password reset request'
            };
        }
    };

    const resetPassword = async (token: string, password: string, confirmPassword: string) => {
        try {
            console.log('[AuthContext] Resetting password with token');

            const response = await LocalAuthAPI.resetPassword(token, {
                password,
                confirmPassword
            });

            if (response.success) {
                console.log('[AuthContext] Password reset successful');
                return { success: true };
            }

            console.log('[AuthContext] Password reset failed:', response.error?.message);
            return {
                success: false,
                error: response.error?.message || 'Password reset failed'
            };
        } catch (error) {
            console.error('[AuthContext] Password reset error:', error);
            return {
                success: false,
                error: 'Network error during password reset'
            };
        }
    };

    const value = {
        isAuthenticated: hasAccounts(),
        isLoading,
        error,
        logout,
        logoutAll,
        tokenRevocation,

        // Local auth methods
        localLogin,
        localSignup,
        verifyTwoFactor,
        requestPasswordReset,
        resetPassword
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