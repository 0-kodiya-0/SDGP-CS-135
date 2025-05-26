import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { LocalAuthAPI } from '../features/default/user_account/api/localAuth.api';
import { useAccountStore } from '../features/default/user_account/store/account.store';

const TwoFactorVerificationPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { addAccount } = useAccountStore();
    
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { tempToken, accountId } = location.state || {};

    useEffect(() => {
        if (!tempToken || !accountId) {
            navigate('/login');
        }
    }, [tempToken, accountId, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!code.trim()) {
            setError('Please enter the verification code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await LocalAuthAPI.verifyTwoFactor({
                token: code,
                tempToken
            });

            if (response.success && response.data?.accountId) {
                addAccount(response.data.accountId);
                navigate(`/app/${response.data.accountId}`);
            } else {
                setError('Invalid verification code. Please try again.');
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackupCodes = () => {
        navigate('/backup-codes', {
            state: { tempToken, accountId }
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Verifying code...</span>
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
                        Two-Factor Authentication
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter the verification code from your authenticator app
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                Verification Code
                            </label>
                            <div className="mt-1">
                                <input
                                    id="code"
                                    name="code"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    autoComplete="one-time-code"
                                    maxLength={8}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest"
                                    placeholder="000000"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Verify Code
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Having trouble?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col space-y-3">
                            <button
                                type="button"
                                onClick={handleBackupCodes}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Use backup code instead
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center justify-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                <ArrowLeft size={16} className="mr-1" />
                                Back to login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorVerificationPage;