import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import { LocalAuthAPI } from '../features/default/user_account/api/localAuth.api';
import { PasswordStrengthIndicator, usePasswordValidation } from '../features/default/user_account/components/PasswordStrengthIndicator';

const PasswordResetPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const token = searchParams.get('token');
    const passwordValidation = usePasswordValidation(formData.password);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        } else if (!passwordValidation.isValid) {
            newErrors.password = 'Password does not meet all requirements';
        }

        if (!formData.confirmPassword.trim()) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!token) {
            setErrors({ general: 'Invalid reset link' });
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const response = await LocalAuthAPI.resetPassword(token, {
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });

            if (response.success) {
                navigate('/login', {
                    state: { 
                        message: 'Password reset successfully! You can now sign in with your new password.' 
                    }
                });
            } else {
                setErrors({ general: response.error?.message || 'Password reset failed' });
            }
        } catch (error) {
            console.error('Password reset error:', error);
            setErrors({ general: 'An error occurred. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                        <h2 className="text-2xl font-medium text-gray-900 mb-2">Invalid Reset Link</h2>
                        <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
                        <button
                            onClick={() => navigate('/forgot-password')}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Request new reset link
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Resetting your password...</span>
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
                        Reset your password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your new password below
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
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                        errors.password ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter new password"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>
                            
                            {/* Password strength indicator */}
                            {formData.password && (
                                <div className="mt-3">
                                    <PasswordStrengthIndicator password={formData.password} />
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm New Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                    placeholder="Confirm new password"
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Reset Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PasswordResetPage;