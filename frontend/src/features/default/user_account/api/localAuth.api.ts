import axios from 'axios';
import { API_BASE_URL } from '../../../../conf/axios';
import { LocalSignupRequest, LocalAuthResponse, LocalLoginRequest, TwoFactorVerifyRequest, PasswordResetRequest, ResetPasswordRequest, PasswordChangeRequest, TwoFactorSetupRequest, TwoFactorVerifySetupRequest, GenerateBackupCodesRequest } from '../types/types.localAuth.api';

/**
 * Local Authentication API Functions
 */
export class LocalAuthAPI {
    
    /**
     * Register a new local account
     */
    static async signup(data: LocalSignupRequest): Promise<LocalAuthResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/signup`, data, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] Signup successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] Signup error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during signup');
        }
    }

    /**
     * Login with local credentials
     */
    static async login(data: LocalLoginRequest): Promise<LocalAuthResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, data, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] Login successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] Login error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during login');
        }
    }

    /**
     * Verify two-factor authentication code
     */
    static async verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<LocalAuthResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/verify-two-factor`, data, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] 2FA verification successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] 2FA verification error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during 2FA verification');
        }
    }

    /**
     * Request password reset email
     */
    static async requestPasswordReset(data: PasswordResetRequest): Promise<LocalAuthResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/reset-password-request`, data, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] Password reset request successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] Password reset request error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during password reset request');
        }
    }

    /**
     * Reset password with token
     */
    static async resetPassword(token: string, data: ResetPasswordRequest): Promise<LocalAuthResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/reset-password?token=${token}`, data, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] Password reset successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] Password reset error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during password reset');
        }
    }

    /**
     * Change password (authenticated user)
     */
    static async changePassword(accountId: string, data: PasswordChangeRequest): Promise<LocalAuthResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/${accountId}/auth/change-password`, data, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] Password change successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] Password change error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during password change');
        }
    }

    /**
     * Setup two-factor authentication
     */
    static async setupTwoFactor(accountId: string, data: TwoFactorSetupRequest): Promise<LocalAuthResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/${accountId}/auth/setup-two-factor`, data, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] 2FA setup successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] 2FA setup error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during 2FA setup');
        }
    }

    /**
     * Verify and enable two-factor authentication
     */
    static async verifyTwoFactorSetup(accountId: string, data: TwoFactorVerifySetupRequest): Promise<LocalAuthResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/${accountId}/auth/verify-two-factor-setup`, data, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] 2FA setup verification successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] 2FA setup verification error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during 2FA setup verification');
        }
    }

    /**
     * Generate new backup codes
     */
    static async generateBackupCodes(accountId: string, data: GenerateBackupCodesRequest): Promise<LocalAuthResponse> {
        try {
            const response = await axios.post(`${API_BASE_URL}/${accountId}/auth/generate-backup-codes`, data, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] Backup codes generation successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] Backup codes generation error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during backup codes generation');
        }
    }

    /**
     * Verify email address
     */
    static async verifyEmail(token: string): Promise<LocalAuthResponse> {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/verify-email?token=${token}`, {
                withCredentials: true
            });
            
            console.log('[LocalAuth] Email verification successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[LocalAuth] Email verification error:', error.response?.data || error.message);
            
            if (error.response?.data) {
                return error.response.data;
            }
            
            throw new Error('Network error during email verification');
        }
    }
}