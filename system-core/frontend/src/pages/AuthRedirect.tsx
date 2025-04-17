import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/default/user_account';
import { useAccountStore } from '../features/default/user_account/store/account.store';

/**
 * Component that redirects to the preferred account or account selection page
 * This should be used for the root route (/)
 */
const AuthRedirect: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const { accountIds } = useAccountStore(); // Use the store
    const [redirectPath, setRedirectPath] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoading && isAuthenticated && accountIds.length > 0) {
            // Check if there's a preferred account
            const preferredAccountId = localStorage.getItem('preferredAccountId');

            if (preferredAccountId) {
                // Check if this account exists in our store
                const accountExists = accountIds.includes(preferredAccountId);

                if (accountExists) {
                    setRedirectPath(`/app/${preferredAccountId}`);
                    return;
                }
            }

            // Default to account selection if no preferred account or it doesn't exist
            if (accountIds.length > 1) {
                setRedirectPath('/accounts');
            } else if (accountIds.length === 1) {
                // If there's only one account, go directly to it
                setRedirectPath(`/app/${accountIds[0]}`);
            }
        } else if (!isLoading && !isAuthenticated) {
            // If not authenticated, redirect to login
            setRedirectPath('/login');
        }
    }, [isLoading]);

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