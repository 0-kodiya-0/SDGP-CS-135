import { useState, useCallback, useEffect } from 'react';
import { useGooglePermissions } from '../../user_account/hooks/usePermissions.google';
import { ScopeLevel, ServicePermissions, ServiceType, UseServicePermissionsReturn } from '../types/types.google.api';
import { useGooglePermissionsStore, usePermissionsCacheState } from '../store/googlePermission.store';

/**
 * Hook for managing Google service-specific permissions
 * This wraps the useGooglePermissions hook with service-specific functionality
 */
export const useServicePermissions = (
  accountId: string | null,
  serviceType: ServiceType
): UseServicePermissionsReturn => {
  // Use the base Google permissions hook
  const { verifyServiceAccess, invalidatePermission, getValidScopesForService, requestMissingPermissions } = useGooglePermissions();

  // Get valid scopes for this service
  const availableScopes = getValidScopesForService(serviceType);

  // Initialize permissions object with all scopes set to false
  // const initialPermissions = availableScopes.reduce((acc, scope) => {
  //   acc[scope] = false;
  //   return acc;
  // }, {} as ServicePermissions);

  // // Track service permission states
  // const [permissions, setPermissions] = useState<ServicePermissions>(initialPermissions);

  const permissions = useGooglePermissionsStore(usePermissionsCacheState(accountId, serviceType)) as unknown as ServicePermissions;
  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  /**
   * Load permissions on mount to take advantage of cached permissions immediately
   */
  useEffect(() => {
    // Skip if no account ID is provided
    if (!accountId) return;

    // Only load if permissions haven't been loaded yet
    if (!permissionsLoading) {
      checkAllServicePermissions();
    }
  }, [accountId]); // Only run when accountId changes

  /**
   * Check all service permissions at once and track their states
   */
  const checkAllServicePermissions = useCallback(async (rMissingPermissions: boolean = false): Promise<void> => {
    if (!accountId) {
      return;
    }

    setPermissionsLoading(true);
    setPermissionError(null);

    try {
      // Request all valid scopes for this service
      const { missingPermissions } = await verifyServiceAccess(accountId, serviceType, availableScopes);

      if (rMissingPermissions) {
        requestMissingPermissions(accountId, serviceType, missingPermissions);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setPermissionError(`Failed to check ${serviceType} permissions: ${errorMessage}`);
    } finally {
      setPermissionsLoading(false);
    }
  }, [accountId, verifyServiceAccess, serviceType, availableScopes, requestMissingPermissions]);

  /**
   * Check if the user has the required permission level
   * Optimized to return early results for common cases
   */
  const hasRequiredPermission = useCallback((requiredScope: ScopeLevel): boolean => {
    // If 'full' permission is granted, allow access to any scope
    if (permissions['full']?.hasAccess === true) {
      return true;
    }

    // Check if the requested scope is valid for this service
    if (!availableScopes.includes(requiredScope)) {
      console.warn(`Requested scope "${requiredScope}" is not valid for ${serviceType} service`);
      return false;
    }

    // Check for the specific permission
    return permissions[requiredScope]?.hasAccess === true;
  }, [availableScopes, permissions, serviceType]);

  /**
   * Invalidate a service permission when an API call fails due to permission issues
   */
  const invalidateServicePermission = useCallback((scope: ScopeLevel): void => {
    // Check if the scope is valid for this service
    if (!availableScopes.includes(scope)) {
      console.warn(`Attempted to invalidate scope "${scope}" which is not valid for ${serviceType} service`);
      return;
    }

    // Only proceed if we have an account ID
    if (!accountId) return;

    // Invalidate in the base hook
    invalidatePermission(accountId, serviceType, scope);
  }, [availableScopes, accountId, invalidatePermission, serviceType]);

  return {
    permissions,
    permissionsLoading,
    permissionError,
    checkAllServicePermissions,
    hasRequiredPermission,
    invalidateServicePermission,
    availableScopes
  };
};