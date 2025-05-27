import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { LocalAuthAPI } from '../features/default/user_account/api/localAuth.api';

const EmailVerificationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get('token');
            
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link');
                return;
            }

            try {
                const response = await LocalAuthAPI.verifyEmail(token);
                
                if (response.success) {
                    setStatus('success');
                    setMessage('Your email has been verified successfully!');
                    
                    // Auto redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login', {
                            state: { message: 'Email verified! You can now sign in.' }
                        });
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(response.error?.message || 'Email verification failed');
                }
            } catch (error) {
                console.error('Email verification error:', error);
                setStatus('error');
                setMessage('An error occurred during email verification');
            }
        };

        verifyEmail();
    }, [searchParams]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <Loader2 className="h-16 w-16 text-blue-500 mx-auto mb-4 animate-spin" />
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">
                            Verifying your email...
                        </h2>
                        <p className="text-gray-600">Please wait while we verify your email address.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {status === 'success' ? 'Email Verified' : 'Verification Failed'}
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    {status === 'success' ? (
                        <>
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                            <p className="text-gray-600 mb-6">{message}</p>
                            <p className="text-sm text-gray-500">
                                You will be redirected to the login page automatically...
                            </p>
                        </>
                    ) : (
                        <>
                            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                            <p className="text-gray-600 mb-6">{message}</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Go to Login
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationPage;