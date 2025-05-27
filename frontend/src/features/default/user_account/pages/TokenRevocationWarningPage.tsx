import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../../../conf/axios';
import { useAccountStore } from '../store/account.store';

const TokenRevocationWarningPage: React.FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const [searchParams] = useSearchParams();
    const provider = searchParams.get('provider');
    const { removeAccount } = useAccountStore();
    const navigate = useNavigate();
    const [isRevoking, setIsRevoking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCancel = () => {
        navigate(`/app/${accountId}`);
    };

    const handleRevoke = async () => {
        if (!accountId) {
            setError('Missing accountId in url params');
            return;
        }

        if (!provider) {
            setError('Missing provider in url params');
            return;
        }

        try {
            setIsRevoking(true);

            // Use direct axios to revoke the token instead of window.location.href
            await axios.get(`${API_BASE_URL}/${accountId}/account/refreshToken/revoke`, {
                withCredentials: true
            });

            // After successful revocation, navigate to the sign-in page
            window.location.href = `../oauth/signin/${provider}?redirectUrl=${encodeURIComponent("/accounts")}`;
            removeAccount(accountId);
        } catch (err) {
            console.error('Error revoking token:', err);
            setError('Failed to revoke token. Please try again.');
        } finally {
            setIsRevoking(false);
        }
    };

    if (isRevoking) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Revoking token...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Revoke Access Token
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        This action will remove all permissions for this account
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            What happens when you revoke this token?
                        </h3>

                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-start">
                                <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2 mr-3"></div>
                                <span>Your current authorization to the application will be removed</span>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2 mr-3"></div>
                                <span>All previously granted permissions (scopes) will be unlinked</span>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2 mr-3"></div>
                                <span>You will need to sign in again with the correct permissions</span>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0 w-2 h-2 bg-red-400 rounded-full mt-2 mr-3"></div>
                                <span>You will be automatically redirected to the sign-in page</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                        <div className="flex">
                            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                            <div className="ml-3">
                                <h4 className="text-sm font-medium text-yellow-800">
                                    Important Notice
                                </h4>
                                <p className="mt-1 text-sm text-yellow-700">
                                    This action cannot be undone. You will need to re-authenticate and grant permissions again.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-3">
                        <button
                            onClick={handleCancel}
                            className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRevoke}
                            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Revoke Token
                        </button>
                    </div>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="w-full inline-flex items-center justify-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            Back to settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TokenRevocationWarningPage;