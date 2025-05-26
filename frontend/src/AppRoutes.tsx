// frontend/src/AppRoutes.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { EnvironmentProvider } from './features/default/environment/contexts/EnvironmentContext';
import { AuthProvider } from './features/default/user_account/contexts/AuthContext';
import { AccountProvider } from './features/default/user_account/contexts/AccountContext';
import AccountSelectionPage from './features/default/user_account/pages/AccountSelectionPage';
import AccountSettingsPage from './features/default/user_account/pages/AccountSettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthGuard from './pages/AuthGuard';
import { LoginPage, SignupPage, AuthCallback, AuthRedirect } from './pages';
import TokenRevocationWarningPage from './features/default/user_account/pages/TokenRevocationWarningPage';
import PermissionCallback from './pages/PermissionCallback';
import EnvironmentSelectionPage from './features/default/environment/pages/EnvironmentSelectionPage';
import CreateEnvironmentPage from './features/default/environment/pages/CreateEnvironmentPage';
import PermissionConfirmationPage from './pages/PermissionConfirmationPage';
import BackupCodesPage from './pages/BackupCodesPage';
import CheckEmailPage from './pages/CheckEmailPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PasswordResetPage from './pages/PasswordResetPage';
import TwoFactorVerificationPage from './pages/TwoFactorVerificationPage';

export const AppRoutes: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes that don't require authentication */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/permission-confirmation" element={<PermissionConfirmationPage />} />
                    <Route path="/permission/callback" element={<PermissionCallback />} />

                    {/* New local auth routes */}
                    <Route path="/check-email" element={<CheckEmailPage />} />
                    <Route path="/verify-email" element={<EmailVerificationPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<PasswordResetPage />} />
                    <Route path="/two-factor-verify" element={<TwoFactorVerificationPage />} />
                    <Route path="/backup-codes" element={<BackupCodesPage />} />

                    {/* Root redirects to preferred account or account selection */}
                    <Route path="/" element={<AuthRedirect />} />

                    {/* Account selection page */}
                    <Route path="/accounts" element={
                        <AuthGuard>
                            <AccountProvider>
                                <AccountSelectionPage />
                            </AccountProvider>
                        </AuthGuard>
                    } />

                    {/* Account settings page */}
                    <Route path="/app/:accountId/settings" element={
                        <AuthGuard>
                            <AccountProvider>
                                <AccountSettingsPage />
                            </AccountProvider>
                        </AuthGuard>
                    } />

                    <Route path="/app/:accountId/revoke" element={
                        <TokenRevocationWarningPage />
                    } />

                    {/* Environment Routes */}
                    <Route path="/app/:accountId/environments" element={
                        <AuthGuard>
                            <AccountProvider>
                                <EnvironmentSelectionPage />
                            </AccountProvider>
                        </AuthGuard>
                    } />
                    
                    <Route path="/app/:accountId/environments/create" element={
                        <AuthGuard>
                            <AccountProvider>
                                <CreateEnvironmentPage />
                            </AccountProvider>
                        </AuthGuard>
                    } />

                    {/* Main application routes */}
                    <Route path="/app/:accountId/*" element={
                        <AuthGuard>
                            <AccountProvider>
                                <EnvironmentProvider>
                                    <App />
                                </EnvironmentProvider>
                            </AccountProvider>
                        </AuthGuard>
                    } />

                    {/* 404 page */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default AppRoutes;