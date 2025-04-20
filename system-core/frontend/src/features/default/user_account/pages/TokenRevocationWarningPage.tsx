import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-red-600">Warning: Token Revocation</h2>
                </div>

                <div className="mb-6">
                    <p className="mb-4">
                        You are about to revoke the OAuth token for this account. This means:
                    </p>

                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Your current authorization to the application will be removed</li>
                        <li>All previously granted permissions (scopes) will be unlinked</li>
                        <li>You will need to sign in again with the correct permissions</li>
                        <li>You will be automatically redirected to the sign-in page</li>
                    </ul>

                    <p className="font-medium">
                        Do you want to continue with revoking this token?
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <div className="flex justify-between">
                    <button
                        onClick={handleCancel}
                        disabled={isRevoking}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRevoke}
                        disabled={isRevoking}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                        {isRevoking ? 'Revoking...' : 'Revoke Token'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TokenRevocationWarningPage;