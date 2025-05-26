import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { LoginPage, SignupPage, AuthCallback, AuthRedirect, BackupCodesPage, CheckEmailPage, EmailVerificationPage, ForgotPasswordPage, NotFoundPage, PasswordResetPage, PermissionCallback, TwoFactorVerificationPage, AuthGuard, PermissionConfirmationPage } from './pages';
import { AccountProvider, AccountSelectionPage, AccountSettingsPage, AuthProvider, TokenRevocationWarningPage } from './features/default/user_account';
import { EnvironmentSelectionPage, CreateEnvironmentPage, EnvironmentProvider } from './features/default/environment';

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