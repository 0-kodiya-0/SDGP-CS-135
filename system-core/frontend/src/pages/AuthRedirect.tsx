import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/default/user_account';

/**
 * Component that redirects to the preferred account or account selection page
 * This should be used for the root route (/)
 */
const AuthRedirect: React.FC = () => {
    const { session, isAuthenticated, isLoading } = useAuth();
    const [redirectPath, setRedirectPath] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && isAuthenticated && session) {
            // Check if there's a preferred account
            const preferredAccountId = localStorage.getItem('preferredAccountId');

            if (preferredAccountId) {
                // Check if this account exists in the current session
                const accountExists = session.accounts.some(account => account.accountId === preferredAccountId);

                if (accountExists) {
                    setRedirectPath(`/app/${preferredAccountId}`);
                    return;
                }
            }

            // Default to account selection if no preferred account or it doesn't exist
            setRedirectPath('/accounts');
        } else if (!isLoading && !isAuthenticated) {
            // If not authenticated, redirect to login
            setRedirectPath('/login');
        }
    }, [isLoading, isAuthenticated, session]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Only redirect once we have determined the path
    if (redirectPath) {
        return <Navigate to={redirectPath} replace />;
    }

    // Show loading while we're figuring out where to redirect
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
};

export default AuthRedirect;