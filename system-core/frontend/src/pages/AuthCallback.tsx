import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useAccountStore } from '../features/default/user_account/store/account.store';

/**
 * Component to handle OAuth redirects and process auth status
 */
const AuthCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>('');

    const { addAccount } = useAccountStore();

    // Process authentication result only once on component mount
    useEffect(() => {
        try {
            // Get parameters directly from searchParams
            const authStatus = searchParams.get('status');
            const errorCode = searchParams.get('errorCode');
            const errorMessage = searchParams.get('errorMessage');
            const accountId = searchParams.get("accountId");
            const returnTo = searchParams.get('returnTo');

            // Process the authentication result
            if (authStatus === 'error') {
                setStatus('error');
                setMessage(errorMessage ? decodeURIComponent(errorMessage) : `Authentication failed (${errorCode || 'unknown error'})`);
            } else if (authStatus === 'success') {
                setStatus('success');

                if (accountId) {
                    addAccount(accountId);

                    setTimeout(() => {
                        navigate(`/app/${accountId}`);
                    }, 1500);
                } else if (returnTo) {
                    setTimeout(() => {
                        navigate(returnTo);
                    }, 1500);
                } else {
                    navigate("/");
                }
            } else {
                navigate('/login');
            }
        } catch (error) {
            console.error('Error processing auth callback:', error);
            setStatus('error');
            setMessage('An unexpected error occurred while processing authentication.');
        }
    }, []); // Only depend on isProcessing flag

    const handleGoBack = () => {
        navigate(-1);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Processing authentication...</h2>
                        <p className="text-gray-600">Please wait while we complete your sign-in.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Authentication Failed</h2>
                        <p className="text-gray-600 mb-6">{message}</p>

                        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                            <button
                                onClick={handleGoBack}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                Go back
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-medium text-gray-900 mb-2">Authentication Successful</h2>
                    <p className="text-gray-600 mb-6">
                        You've been successfully authenticated.
                        Redirecting to ...
                    </p>
                    <button
                        onClick={() => navigate('/accounts')}
                        className="mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Click here if not redirected automatically
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthCallback;