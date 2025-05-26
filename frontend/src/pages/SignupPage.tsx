import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { LocalAuthAPI } from '../features/default/user_account/api/localAuth.api';
import { PasswordStrengthIndicator, usePasswordValidation } from '../features/default/user_account/components/PasswordStrengthIndicator';
import { LocalSignupRequest } from '../features/default/user_account/types/types.localAuth.api';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        birthdate: '',
        agreeToTerms: false
    });

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [authMethod, setAuthMethod] = useState<'oauth' | 'local'>('oauth');

    // Password validation
    const passwordValidation = usePasswordValidation(formData.password);

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

        // Required fields validation
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

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

        if (!formData.agreeToTerms) {
            newErrors.agreeToTerms = 'You must agree to the terms and conditions';
        }

        // Optional username validation (if provided)
        if (formData.username.trim() && formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLocalSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const signupData: LocalSignupRequest = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                username: formData.username.trim() || undefined,
                password: formData.password,
                confirmPassword: formData.confirmPassword,
                birthdate: formData.birthdate || undefined,
                agreeToTerms: formData.agreeToTerms
            };

            const response = await LocalAuthAPI.signup(signupData);

            if (response.success && response.data) {
                // Success - redirect to check email page
                navigate('/check-email', {
                    state: {
                        email: formData.email,
                        type: 'verification',
                        message: response.data.message || 'Please check your email to verify your account.'
                    }
                });
            } else {
                // Handle errors from backend
                if (response.error) {
                    if (response.error.message.includes('Email already in use')) {
                        setErrors({ email: 'This email is already registered' });
                    } else if (response.error.message.includes('Username already in use')) {
                        setErrors({ username: 'This username is already taken' });
                    } else {
                        setErrors({ general: response.error.message });
                    }
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            setErrors({
                general: 'An error occurred during registration. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        window.location.href = `/api/v1/oauth/signup/google?redirectUrl=${encodeURIComponent(`/auth/callback?returnTo=${returnPath}`)}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Creating your account...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Create a new account
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Auth method selector */}
                    <div className="mb-6">
                        <div className="flex rounded-md shadow-sm" role="group">
                            <button
                                type="button"
                                onClick={() => setAuthMethod('oauth')}
                                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
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
                                className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
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
                                onClick={handleGoogleSignup}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign up with Google
                            </button>
                        </div>
                    ) : (
                        /* Local Auth Section */
                        <form onSubmit={handleLocalSignup} className="space-y-6">
                            {/* Name fields */}
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                        First name *
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="firstName"
                                            id="firstName"
                                            autoComplete="given-name"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border rounded-md px-3 py-2 ${
                                                errors.firstName ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="John"
                                        />
                                        {errors.firstName && (
                                            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                        Last name *
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="lastName"
                                            id="lastName"
                                            autoComplete="family-name"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border rounded-md px-3 py-2 ${
                                                errors.lastName ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                            placeholder="Doe"
                                        />
                                        {errors.lastName && (
                                            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email address *
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                            errors.email ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="john.doe@example.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>
                            </div>

                            {/* Username (optional) */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username (optional)
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        autoComplete="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                                            errors.username ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                        placeholder="johndoe (optional)"
                                    />
                                    {errors.username && (
                                        <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                    )}
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Password *
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
                                        placeholder="Create a strong password"
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

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                    Confirm password *
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
                                        placeholder="Confirm your password"
                                    />
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>

                            {/* Birthdate (optional) */}
                            <div>
                                <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700">
                                    Date of birth (optional)
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="birthdate"
                                        name="birthdate"
                                        type="date"
                                        value={formData.birthdate}
                                        onChange={handleInputChange}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* Terms agreement */}
                            <div className="flex items-center">
                                <input
                                    id="agreeToTerms"
                                    name="agreeToTerms"
                                    type="checkbox"
                                    checked={formData.agreeToTerms}
                                    onChange={handleInputChange}
                                    className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                                        errors.agreeToTerms ? 'border-red-300' : ''
                                    }`}
                                />
                                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                                    I agree to the{' '}
                                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                        Privacy Policy
                                    </a>
                                </label>
                            </div>
                            {errors.agreeToTerms && (
                                <p className="text-sm text-red-600">{errors.agreeToTerms}</p>
                            )}

                            <div>
                                <button
                                    type="submit"
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Create account
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
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <a
                                href="/login"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Sign in instead
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;