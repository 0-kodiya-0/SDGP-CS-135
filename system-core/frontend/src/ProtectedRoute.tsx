import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './features/default/user_account';

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
  children
}) => {
  const { isAuthenticated, isLoading, session } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated but no accounts, redirect to login
  if (session && session.accounts.length === 0) {
    return <Navigate to="/login" replace />;
  }

  // If children are provided, render them directly
  if (children) {
    return <>{children}</>;
  }

  // Otherwise, render the child routes (Outlet)
  return <Outlet />;
};

export const AccountRedirect: React.FC = () => {
  const { session, isLoading } = useAuth();

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to the first account's route if there are accounts
  if (session && session.accounts.length > 0) {
    return <Navigate to={`/app/${session.accounts[0].accountId}`} replace />;
  }

  // If no accounts, redirect to login
  return <Navigate to="/login" replace />;
};