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
import GooglePeopleApi from './examples/GooglePeopleApi';
import ExampleWrapper from './examples';
import GoogleMeetApi from './examples/GoogleMeetApi';
import GoogleCalenderApi from './examples/GoogleCalenderApi';
import GoogleGmailApi from './examples/GoogleGmailApi';
import GoogleDriveApi from './examples/GoogleDriveApi';

export const AppRoutes: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public routes that don't require authentication */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Root redirects to preferred account or account selection */}
                    <Route path="/" element={<AuthRedirect />} />

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

                    <Route path="/app/:accountId/example" element={<ExampleWrapper />}>
                        <Route path="people" element={<GooglePeopleApi />} />
                        <Route path="meet" element={<GoogleMeetApi />} />
                        <Route path="gmail" element={<GoogleGmailApi />} />
                        <Route path="drive" element={<GoogleDriveApi />} />
                        <Route path="calender" element={<GoogleCalenderApi />} />
                    </Route>

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