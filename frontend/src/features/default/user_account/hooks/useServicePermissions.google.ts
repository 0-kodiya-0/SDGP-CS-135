import { useState, useCallback } from 'react';
import { ServiceType, ScopeLevel } from '../types/types.google.api';
import { getValidScopesForService } from '../utils/utils.google';
import { useGooglePermissions } from '../contexts/GooglePermissionContext';

// Service-specific permissions hook
export const useServicePermissions = (accountId: string | null, serviceType: ServiceType) => {
  const {
    permissionsCache,
    isPopupOpen,
    pendingPermissions,
    checkServicePermission,
    requestPermissions,
    hasRequiredPermission: checkPermission,
    invalidatePermission
  } = useGooglePermissions();

  const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Get valid scopes for this service
  const availableScopes = getValidScopesForService(serviceType);

  // Get permissions from cache
  const permissions = accountId && permissionsCache[accountId]?.[serviceType]
    ? permissionsCache[accountId][serviceType]
    : {};

  // Check all service permissions
  const checkAllServicePermissions = useCallback(async (requestMissing: boolean = false) => {
    if (!accountId) return;

    setPermissionsLoading(true);
    setPermissionError(null);

    try {
      const results = await Promise.all(
        availableScopes.map(scope => checkServicePermission(accountId, serviceType, scope))
      );

      const allGranted = results.every(result => result === true);

      if (!allGranted && requestMissing) {
        // Request missing permissions
        await requestPermissions(
          accountId,
          serviceType,
          availableScopes.filter((_, index) => !results[index])
        );
      }
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : 'Failed to check permissions');
    } finally {
      setPermissionsLoading(false);
    }
  }, [accountId, serviceType, availableScopes, checkServicePermission, requestPermissions]);

  // Check if we have a specific permission
  const hasRequiredPermission = useCallback((requiredScope: ScopeLevel): boolean => {
    if (!accountId) return false;

    // If we have full access, we have access to everything
    if (permissions['full']?.hasAccess === true) {
      return true;
    }

    // Otherwise check for the specific permission
    return checkPermission(accountId, serviceType, requiredScope);
  }, [accountId, serviceType, permissions, checkPermission]);

  // Invalidate a specific permission
  const invalidateServicePermission = useCallback((scope: ScopeLevel) => {
    if (!accountId) return;
    invalidatePermission(accountId, serviceType, scope);
  }, [accountId, serviceType, invalidatePermission]);


  return {
    permissions,
    permissionsLoading,
    permissionError,
    checkAllServicePermissions,
    hasRequiredPermission,
    invalidateServicePermission,
    availableScopes,
    isPermissionDialogOpen: isPopupOpen,
    isPendingPermission: (scope: ScopeLevel) =>
      pendingPermissions[`${accountId}:${serviceType}:${scope}`] === true
  };
};