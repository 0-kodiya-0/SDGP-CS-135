import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  redirectPath = '/login'
}) => {
  const { isAuthenticated, isLoading, session } = useAuth();

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to={redirectPath} replace />;
  }

  if (session && session.accounts.length === 0) {
    // If authenticated but no accounts, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If authenticated and has accounts, render the child routes
  return <Outlet />;
};

export const AccountRedirect: React.FC = () => {
  const { session } = useAuth();
  
  if (session && session.accounts.length > 0) {
    // Redirect to the first account's route
    return <Navigate to={`/app/${session.accounts[0].accountId}`} replace />;
  }
  
  // If no accounts, redirect to login
  return <Navigate to="/login" replace />;
};