import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

/**
 * Component to handle Google OAuth permission redirects and process permission status
 */
const PermissionCallback: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>('');
    const [permissionDetails, setPermissionDetails] = useState<{
        service: string;
        scopeLevel: string;
    } | null>(null);

    // Process permission result only once on component mount
    useEffect(() => {
        try {
            // Get parameters directly from searchParams
            const permissionStatus = searchParams.get('status');
            const errorCode = searchParams.get('errorCode');
            const errorMessage = searchParams.get('errorMessage');
            const service = searchParams.get('service');
            const scopeLevel = searchParams.get('scopeLevel');
            const returnTo = searchParams.get('returnTo');

            // Store permission details for message passing
            if (service && scopeLevel) {
                setPermissionDetails({
                    service,
                    scopeLevel
                });
            }

            // Process the permission result
            if (permissionStatus === 'error') {
                setStatus('error');
                setMessage(errorMessage
                    ? decodeURIComponent(errorMessage)
                    : `Permission request failed (${errorCode || 'unknown error'})`);

                // Send message to parent window about the error
                if (window.opener && service && scopeLevel) {
                    window.opener.postMessage({
                        type: 'GOOGLE_PERMISSION_RESULT',
                        success: false,
                        service,
                        scopeLevel,
                        error: errorCode || 'unknown'
                    }, '*');
                }
            } else if (permissionStatus === 'success') {
                setStatus('success');

                // Send message to parent window about the success
                if (window.opener && service && scopeLevel) {
                    window.opener.postMessage({
                        type: 'GOOGLE_PERMISSION_RESULT',
                        success: true,
                        service,
                        scopeLevel
                    }, '*');
                }

                // Close window automatically after successful permission
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                // Unknown status or missing parameters, redirect to main app
                if (returnTo) {
                    navigate(returnTo);
                } else {
                    navigate('/');
                }
            }
        } catch (error) {
            console.error('Error processing permission callback:', error);
            setStatus('error');
            setMessage('An unexpected error occurred while processing permission request.');

            // Send error message to parent window
            if (window.opener && permissionDetails) {
                window.opener.postMessage({
                    type: 'GOOGLE_PERMISSION_RESULT',
                    success: false,
                    service: permissionDetails.service,
                    scopeLevel: permissionDetails.scopeLevel,
                    error: 'unexpected_error'
                }, '*');
            }
        }
    }, [navigate, searchParams, permissionDetails]);

    // Handle closing the window
    const handleClose = () => {
        if (window.opener) {
            // Notify parent window before closing
            if (permissionDetails) {
                window.opener.postMessage({
                    type: 'GOOGLE_PERMISSION_RESULT',
                    success: false,
                    service: permissionDetails.service,
                    scopeLevel: permissionDetails.scopeLevel,
                    userCancelled: true
                }, '*');
            }
            window.close();
        } else {
            // No opener, navigate to main app
            navigate('/');
        }
    };

    // Handle retry for permission
    const handleRetry = () => {
        if (permissionDetails) {
            const { service, scopeLevel } = permissionDetails;
            const redirectUrl = searchParams.get('redirectUrl') || window.location.origin;
            const accountId = searchParams.get('accountId');

            if (accountId) {
                // Reconstruct the permission URL and retry
                const permissionUrl = `/oauth/permission/${service}/${scopeLevel}?accountId=${accountId}&redirectUrl=${encodeURIComponent(redirectUrl)}`;
                window.location.href = permissionUrl;
            } else {
                setMessage('Missing account ID. Cannot retry permission request.');
            }
        } else {
            setMessage('Missing permission details. Cannot retry permission request.');
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Processing permission request...</h2>
                        <p className="text-gray-600">Please wait while we complete your request.</p>
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
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Permission Request Failed</h2>
                        <p className="text-gray-600 mb-6">{message}</p>

                        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                            <button
                                onClick={handleClose}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                Close
                            </button>
                            <button
                                onClick={handleRetry}
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
                    <h2 className="text-2xl font-medium text-gray-900 mb-2">Permission Granted</h2>
                    <p className="text-gray-600 mb-6">
                        The requested permissions have been successfully granted.
                        This window will close automatically...
                    </p>
                    <button
                        onClick={handleClose}
                        className="mt-2 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Close this window
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PermissionCallback;