import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAccountStore } from '../features/default/user_account/store/account.store';
import { LocalAuthAPI } from '../features/default/user_account/api/localAuth.api';
import { LocalLoginRequest } from '../features/default/user_account/types/types.localAuth.api';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { accountIds, addAccount } = useAccountStore();

    // Form state
    const [formData, setFormData] = useState({
        emailOrUsername: '',
        password: '',
        rememberMe: false
    });

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [authMethod, setAuthMethod] = useState<'oauth' | 'local'>('oauth');
    const [showPassword, setShowPassword] = useState(false);

    // Get current path to return to after auth
    const returnPath = encodeURIComponent(location.pathname);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.emailOrUsername.trim()) {
            newErrors.emailOrUsername = 'Email or username is required';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLocalLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            // Determine if input is email or username
            const isEmail = formData.emailOrUsername.includes('@');
            const loginData: LocalLoginRequest = {
                password: formData.password,
                rememberMe: formData.rememberMe,
                ...(isEmail 
                    ? { email: formData.emailOrUsername }
                    : { username: formData.emailOrUsername }
                )
            };

            const response = await LocalAuthAPI.login(loginData);

            if (response.success && response.data) {
                if (response.data.requiresTwoFactor && response.data.tempToken) {
                    // Redirect to 2FA verification page
                    navigate('/two-factor-verify', {
                        state: {
                            tempToken: response.data.tempToken,
                            accountId: response.data.accountId
                        }
                    });
                } else if (response.data.accountId) {
                    // Success - add account and redirect
                    addAccount(response.data.accountId);
                    navigate(`/app/${response.data.accountId}`);
                }
            } else {
                // Show generic error message for security
                setErrors({
                    general: 'Invalid email/username or password'
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            setErrors({
                general: 'An error occurred during login. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `/api/v1/oauth/signin/google?redirectUrl=${encodeURIComponent(`/auth/callback?returnTo=${returnPath}`)}`;
    };

    // Check if user is already authenticated (for UI messaging)
    const isAddingAccount = accountIds.length > 0;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Signing you in...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {isAddingAccount ? 'Add another account' : 'Sign in to your account'}
                </h2>
                {isAddingAccount && (
                    <p className="mt-2 text-center text-sm text-gray-600">
                        You're currently signed in with {accountIds.length} {accountIds.length === 1 ? 'account' : 'accounts'}.
                    </p>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Auth method selector */}
                    <div className="mb-6">
                        <div className="flex rounded-md shadow-sm" role="group">
                            <button
                                type="button"
                                onClick={() => setAuthMethod('oauth')}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
                                    authMethod === 'oauth'
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Google Account
                            </button>
                            <button
                                type="button"
                                onClick={() => setAuthMethod('local')}
                                className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                                    authMethod === 'local'
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Email/Password
                            </button>
                        </div>
                    </div>

                    {/* General error message */}
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                            {errors.general}
                        </div>
                    )}

                    {authMethod === 'oauth' ? (
                        /* Google OAuth Section */
                        <div className="space-y-6">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>
                    ) : (
                        /* Local Auth Section */
                        <form onSubmit={handleLocalLogin} className="space-y-6">
                            <div>
                                <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700">
                                    Email address or username
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="emailOrUsername"
                                        name="emailOrUsername"
                                        type="text"
                                        autoComplete="email username"
                                        value={formData.emailOrUsername}
                                        onChange={handleInputChange}
                                        className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                            errors.emailOrUsername ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter email or username"
                                    />
                                    {errors.emailOrUsername && (
                                        <p className="mt-1 text-sm text-red-600">{errors.emailOrUsername}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1 relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                            errors.password ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Enter password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Eye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="rememberMe"
                                        name="rememberMe"
                                        type="checkbox"
                                        checked={formData.rememberMe}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                                        Remember me
                                    </label>
                                </div>

                                <div className="text-sm">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/forgot-password')}
                                        className="font-medium text-blue-600 hover:text-blue-500"
                                    >
                                        Forgot your password?
                                    </button>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Sign in
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    New to the platform?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col space-y-2">
                            <button
                                onClick={() => navigate('/signup')}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Create a new account
                            </button>

                            {isAddingAccount && (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Return to your account
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;