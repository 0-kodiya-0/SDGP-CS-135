import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from '../App';
import { EnvironmentProvider } from '../features/default/environment/contexts/EnvironmentContext';
import { AuthProvider, LoginPage, SignupPage, ProtectedRoute, AccountRedirect } from '../services/auth';
import { AccountProvider } from '../services/auth/contexts/AccountContext';

export const AppRoutes: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Auth routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                        {/* Root path redirects to first account or login */}
                        <Route path="/" element={<AccountRedirect />} />

                        {/* App routes with account context */}
                        <Route path="/app/:accountId/*" element={
                            <AccountProvider>
                                <EnvironmentProvider>
                                    <App />
                                </EnvironmentProvider>
                            </AccountProvider>
                        } />
                    </Route>

                    {/* Catch all other routes */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default AppRoutes;