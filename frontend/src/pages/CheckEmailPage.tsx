import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

const CheckEmailPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const { email, type, message } = location.state || {
        email: '',
        type: 'verification',
        message: 'Please check your email.'
    };

    const getTitle = () => {
        switch (type) {
            case 'verification':
                return 'Verify your email';
            case 'reset':
                return 'Check your email';
            default:
                return 'Check your email';
        }
    };

    const getDescription = () => {
        switch (type) {
            case 'verification':
                return `We've sent a verification link to ${email}. Click the link in the email to verify your account and complete your registration.`;
            case 'reset':
                return `We've sent a password reset link to ${email}. Click the link in the email to reset your password.`;
            default:
                return message;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    
                    <h2 className="text-2xl font-medium text-gray-900 mb-2">
                        {getTitle()}
                    </h2>
                    
                    <p className="text-gray-600 mb-6">
                        {getDescription()}
                    </p>

                    <div className="space-y-4">
                        <div className="text-sm text-gray-500">
                            <p>Didn't receive the email? Check your spam folder.</p>
                        </div>

                        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                Back to login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckEmailPage;