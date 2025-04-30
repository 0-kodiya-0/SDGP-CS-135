import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/default/user_account';

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * Simple authentication guard component
 * Redirects to login if user is not authenticated
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;