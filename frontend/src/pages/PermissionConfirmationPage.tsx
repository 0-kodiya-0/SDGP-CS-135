import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

const PermissionConfirmationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(10);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const accountId = searchParams.get('accountId');
    const redirectUrl = searchParams.get('redirectUrl');
    const skipRedirectUrl = searchParams.get('skipRedirectUrl');

    // Countdown timer and auto-redirect
    useEffect(() => {
        if (isRedirecting || !redirectUrl) return;

        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            handleProceed();
        }
    }, [countdown, isRedirecting, redirectUrl]);

    // Handle manual proceed button click
    const handleProceed = () => {
        if (!redirectUrl || isRedirecting) return;

        setIsRedirecting(true);
        window.location.href = decodeURIComponent(redirectUrl);
    };

    // Handle cancel/skip
    const handleSkip = () => {
        if (!skipRedirectUrl) {
            navigate('/');
            return;
        }

        window.location.href = decodeURIComponent(skipRedirectUrl);
    };

    // If no reauthorization is needed or missing required parameters
    if (!accountId || !redirectUrl) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Error</h2>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600 mb-6">
                            This page should not be accessed directly.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isRedirecting) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Redirecting to Google...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Additional Permissions Required
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        We need to restore access to these services that you previously granted
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                            These permissions were previously granted and are needed for the application to function properly. You'll be redirected to Google to confirm these permissions.
                        </p>
                        
                        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                            <p className="text-sm text-blue-700">
                                You'll be redirected to Google to confirm these permissions. You can always manage your permissions in account settings later.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={handleProceed}
                            disabled={isRedirecting}
                            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isRedirecting ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Redirecting...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="mr-2 h-4 w-4" />
                                    Proceed ({countdown}s)
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleSkip}
                            disabled={isRedirecting}
                            className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionConfirmationPage;