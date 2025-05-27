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
    const { accountIds } = useAccountStore();
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
    }, [isLoading, isAuthenticated, accountIds]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Loading...</h2>
                        <p className="text-gray-600">Checking your authentication status</p>
                    </div>
                </div>
            </div>
        );
    }

    // Only redirect once we have determined the path
    if (redirectPath) {
        return <Navigate to={redirectPath} replace />;
    }

    // Show loading while we're figuring out where to redirect
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-medium text-gray-900 mb-2">Redirecting...</h2>
                    <p className="text-gray-600">Taking you to the right place</p>
                </div>
            </div>
        </div>
    );
};

export default AuthRedirect;