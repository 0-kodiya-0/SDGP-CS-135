import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import { EnvironmentProvider } from './features/default/environment/contexts/EnvironmentContext';
import { AuthProvider } from './features/default/user_account/contexts/AuthContext';
import { AccountProvider } from './features/default/user_account/contexts/AccountContext';
import LoginPage from './features/default/user_account/pages/LoginPage';
import SignupPage from './features/default/user_account/pages/SignupPage';
import AccountSelectionPage from './features/default/user_account/pages/AccountSelectionPage';
import AccountSettingsPage from './features/default/user_account/pages/AccountSettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthGuard from './features/default/user_account/components/AuthGuard';

export const AppRoutes: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes that don't require authentication */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    {/* Root redirects to accounts page or login */}
                    <Route path="/" element={<AuthGuard><Navigate to="/accounts" /></AuthGuard>} />

                    {/* Account selection page */}
                    <Route path="/accounts" element={<AuthGuard><AccountSelectionPage /></AuthGuard>} />

                    {/* Account settings page */}
                    <Route path="/app/:accountId/settings" element={
                        <AuthGuard>
                            <AccountProvider>
                                <AccountSettingsPage />
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