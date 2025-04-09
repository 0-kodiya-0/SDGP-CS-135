import { useCallback } from 'react';
import { useTokenApi } from '../../user_account';
import { createPermissionError, requestPermission } from '../../user_account/utils/utils.google';
import { CalendarScope, DocsScope, DriveScope, GmailScope, MeetScope, PeopleScope, ScopeLevel, ServiceType } from '../types/types.google.api';
import { useGooglePermissionsStore } from '../store/googlePermission.store';

// Type guard functions to check scope compatibility with service - unchanged
export const isGmailScope = (scope: ScopeLevel): scope is GmailScope => {
  return ['readonly', 'full', 'send', 'compose'].includes(scope);
};

export const isCalendarScope = (scope: ScopeLevel): scope is CalendarScope => {
  return ['readonly', 'full', 'event', 'addonly'].includes(scope);
};

export const isDriveScope = (scope: ScopeLevel): scope is DriveScope => {
  return ['readonly', 'full', 'file', 'metadata', 'appdata'].includes(scope);
};

export const isDocsScope = (scope: ScopeLevel): scope is DocsScope => {
  return ['readonly', 'full', 'create', 'edit'].includes(scope);
};

export const isPeopleScope = (scope: ScopeLevel): scope is PeopleScope => {
  return ['readonly', 'full', 'contacts', 'directory'].includes(scope);
};

export const isMeetScope = (scope: ScopeLevel): scope is MeetScope => {
  return ['readonly', 'full', 'schedule', 'join'].includes(scope);
};

// Helper to get valid scopes for a service - unchanged
export const getValidScopesForService = (service: ServiceType): ScopeLevel[] => {
  switch (service) {
    case 'gmail':
      return ['readonly', 'send', 'compose', 'full'];
    case 'calendar':
      return ['readonly', 'event', 'addonly', 'full'];
    case 'drive':
      return ['readonly', 'file', 'metadata', 'appdata', 'full'];
    case 'sheets':
    case 'docs':
      return ['readonly', 'create', 'edit', 'full'];
    case 'people':
      return ['readonly', 'contacts', 'directory', 'full'];
    case 'meet':
      return ['readonly', 'schedule', 'join', 'full'];
    default:
      return ['readonly', 'full'];
  }
};

/**
 * Hook that manages Google API permissions using persistent Zustand store
 * to avoid redundant permission requests across hooks and sessions
 */
export const useGooglePermissions = () => {
  const { checkServiceAccess } = useTokenApi();

  // Use Zustand store for persistent permissions cache
  const {
    isCacheValid,
    getPermission,
    updateCache,
    invalidatePermission,
    clearAccountPermissions,
    clearAllPermissions
  } = useGooglePermissionsStore();

  /**
   * Check and request permission for a specific Google service and one or more scope levels
   * Uses cached results when available to avoid repeated permission requests
   * Validates that requested scopes are valid for the service
   */
  const verifyServiceAccess = useCallback(async (
    accountId: string,
    service: ServiceType,
    scopeLevels: ScopeLevel | ScopeLevel[] = "readonly"
  ): Promise<Record<ScopeLevel, boolean>> => {
    // Convert single scope to array for consistent handling
    const requestedScopes = Array.isArray(scopeLevels) ? scopeLevels : [scopeLevels];
    const results: Record<ScopeLevel, boolean> = {} as Record<ScopeLevel, boolean>;

    // Get valid scopes for this service
    const validScopes = getValidScopesForService(service);

    // Filter out invalid scopes
    const scopes = requestedScopes.filter(scope => validScopes.includes(scope));

    // Warn if any invalid scopes were requested
    if (scopes.length !== requestedScopes.length) {
      console.warn(`Some requested scopes are not valid for ${service} service. Valid scopes are: ${validScopes.join(', ')}`);
    }

    // Check if we have all permissions cached
    let allCached = true;
    const missingScopes: ScopeLevel[] = [];

    for (const scope of scopes) {
      const cachedPermission = getPermission(accountId, service, scope);
      if (isCacheValid(cachedPermission)) {
        results[scope] = true;
      } else {
        allCached = false;
        missingScopes.push(scope);
      }
    }

    // If all scopes are cached with valid permissions, return early
    if (allCached) {
      return results;
    }

    try {
      // Make a single API call to check all missing scopes at once
      const accessCheck = await checkServiceAccess(accountId, service, missingScopes);

      if (accessCheck?.scopeResults) {
        // Process the results for each scope
        const missingPermissionScopes: ScopeLevel[] = [];

        for (const scope of missingScopes) {
          const scopeResult = accessCheck.scopeResults[scope];
          const hasAccess = scopeResult?.hasAccess || false;

          // Update cache and results
          updateCache(accountId, service, scope, hasAccess);
          results[scope] = hasAccess;

          // Keep track of missing permission scopes
          if (!hasAccess) {
            missingPermissionScopes.push(scope);
          }
        }

        // If we have missing permissions, request them all at once
        if (missingPermissionScopes.length > 0) {
          // Create a combined permission error for all missing scopes
          const permissionError = createPermissionError(service, missingPermissionScopes, accountId);
          requestPermission(permissionError);
        }
      } else {
        // If the API call failed, mark all scopes as not having access
        for (const scope of missingScopes) {
          results[scope] = false;
          invalidatePermission(accountId, service, scope);
        }
      }

      return results;
    } catch (err) {
      console.error(`Error checking ${service} access:`, err);

      // On error, invalidate all relevant cache entries
      missingScopes.forEach(scope => {
        results[scope] = false;
        invalidatePermission(accountId, service, scope);
      });

      return results;
    }
  }, [checkServiceAccess, getPermission, invalidatePermission, isCacheValid, updateCache]);

  return {
    verifyServiceAccess,
    invalidatePermission,
    clearAccountPermissions,
    clearAllPermissions,
    getValidScopesForService
  };
};
