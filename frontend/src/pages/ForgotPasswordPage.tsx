import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { LocalAuthAPI } from '../features/default/user_account/api/localAuth.api';

const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await LocalAuthAPI.requestPasswordReset({ email });

            if (response.success) {
                navigate('/check-email', {
                    state: {
                        email,
                        type: 'reset',
                        message: response.data?.message || 'Password reset instructions have been sent to your email.'
                    }
                });
            } else {
                setErrors({ general: response.error?.message || 'An error occurred' });
            }
        } catch (error) {
            console.error('Password reset request error:', error);
            setErrors({ general: 'An error occurred. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Sending reset instructions...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-extrabold text-gray-900">
                        Forgot your password?
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email address and we'll send you a reset link
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter your email address"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Send reset instructions
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="w-full inline-flex items-center justify-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft size={16} className="mr-1" />
                            Back to login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;