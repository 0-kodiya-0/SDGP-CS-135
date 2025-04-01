import { useCallback, useState } from 'react';
import { useTokenApi } from '../../user_account';
import { createPermissionError, requestPermission } from '../../user_account/utils/utils.google';

// Enhanced permission scope types
export type ScopeLevel = "readonly" | "send" | "compose" | "full";
export type ServiceType = "gmail" | "calendar" | "drive" | "sheets" | "docs";

// Permission cache interface with improved typing
interface PermissionCacheEntry {
    hasAccess: boolean;
    lastChecked: number;
}

interface ServiceCache {
    [scope: string]: PermissionCacheEntry;
}

interface AccountCache {
    [service: string]: ServiceCache;
}

interface PermissionCache {
    [accountId: string]: AccountCache;
}

// Define order of scope levels for permission inheritance
const SCOPE_HIERARCHY: Record<ScopeLevel, number> = {
    "readonly": 0,
    "send": 1,
    "compose": 2,
    "full": 3
};

/**
 * Hook that manages Google API permissions and caches results
 * to avoid redundant permission requests across hooks
 */
export const useGooglePermissions = () => {
    const { checkServiceAccess } = useTokenApi();

    // Use state instead of ref since we don't need cross-page persistence
    const [permissionCache, setPermissionCache] = useState<PermissionCache>({});

    // Cache duration in milliseconds (5 minutes)
    const CACHE_DURATION = 5 * 60 * 1000;

    /**
     * Get implied permissions based on scope level
     */
    const getImpliedPermissions = (scopeLevel: ScopeLevel): ScopeLevel[] => {
        const currentLevel = SCOPE_HIERARCHY[scopeLevel];
        return Object.entries(SCOPE_HIERARCHY)
            .filter(([_, level]) => level < currentLevel)
            .map(([scope]) => scope as ScopeLevel);
    };

    /**
     * Check if cache entry is still valid
     */
    const isCacheValid = (entry?: PermissionCacheEntry): boolean => {
        if (!entry) return false;
        return Date.now() - entry.lastChecked < CACHE_DURATION;
    };

    /**
     * Update the permission cache with new values
     */
    const updateCache = useCallback((
        accountId: string,
        service: ServiceType,
        scopeLevel: ScopeLevel,
        hasAccess: boolean
    ): void => {
        setPermissionCache(prevCache => {
            const now = Date.now();
            const newCache = { ...prevCache };

            // Create nested structure if needed
            if (!newCache[accountId]) newCache[accountId] = {};
            if (!newCache[accountId][service]) newCache[accountId][service] = {};

            // Update the specific permission
            newCache[accountId][service][scopeLevel] = {
                hasAccess,
                lastChecked: now
            };

            // If granted, also update implied permissions
            if (hasAccess) {
                const impliedScopes = getImpliedPermissions(scopeLevel);
                impliedScopes.forEach(impliedScope => {
                    newCache[accountId][service][impliedScope] = {
                        hasAccess: true,
                        lastChecked: now
                    };
                });
            }

            return newCache;
        });
    }, []);

    /**
     * Check and request permission for a specific Google service and scope level
     * Uses cached results when available to avoid repeated permission requests
     */
    const verifyServiceAccess = useCallback(async (
        accountId: string,
        service: ServiceType,
        scopeLevel: ScopeLevel = "readonly"
    ): Promise<boolean> => {
        try {
            // Check if we have this specific permission cached
            const specificCache = permissionCache[accountId]?.[service]?.[scopeLevel];
            if (isCacheValid(specificCache)) {
                return specificCache.hasAccess;
            }

            // Check if we have a higher-level permission already cached
            const higherScopes = Object.entries(SCOPE_HIERARCHY)
                .filter(([scope, level]) => level > SCOPE_HIERARCHY[scopeLevel])
                .map(([scope]) => scope as ScopeLevel);

            for (const higherScope of higherScopes) {
                const higherCache = permissionCache[accountId]?.[service]?.[higherScope];
                if (isCacheValid(higherCache) && higherCache.hasAccess) {
                    // If we have higher permission, we implicitly have this one too
                    updateCache(accountId, service, scopeLevel, true);
                    return true;
                }
            }

            // If no valid cache, check with the server
            const accessCheck = await checkServiceAccess(accountId, service, scopeLevel);
            const hasAccess = accessCheck?.hasAccess || false;

            // Update cache with the result
            updateCache(accountId, service, scopeLevel, hasAccess);

            // If access check failed, request permission
            if (!hasAccess) {
                const permissionError = createPermissionError(service, scopeLevel, accountId);
                requestPermission(permissionError);
            }

            return hasAccess;
        } catch (err) {
            console.error(`Error checking ${service} access:`, err);
            return false;
        }
    }, [checkServiceAccess, permissionCache, updateCache]);

    /**
     * Invalidate cached permission when it's no longer valid
     * (e.g., when an API call fails due to permission issues)
     */
    const invalidatePermission = useCallback((
        accountId: string,
        service: ServiceType,
        scopeLevel: ScopeLevel
    ): void => {
        setPermissionCache(prevCache => {
            if (!prevCache[accountId]?.[service]?.[scopeLevel]) {
                return prevCache;
            }

            const newCache = { ...prevCache };
            newCache[accountId][service][scopeLevel].hasAccess = false;

            // Also invalidate higher-level permissions since this failing
            // means higher permissions likely don't exist either
            const higherScopes = Object.entries(SCOPE_HIERARCHY)
                .filter(([scope, level]) => level > SCOPE_HIERARCHY[scopeLevel])
                .map(([scope]) => scope as ScopeLevel);

            higherScopes.forEach(higherScope => {
                if (newCache[accountId]?.[service]?.[higherScope]) {
                    newCache[accountId][service][higherScope].hasAccess = false;
                }
            });

            return newCache;
        });
    }, []);

    /**
     * Clear all cached permissions for a specific account
     */
    const clearAccountPermissions = useCallback((accountId: string): void => {
        setPermissionCache(prevCache => {
            const newCache = { ...prevCache };
            delete newCache[accountId];
            return newCache;
        });
    }, []);

    /**
     * Clear all cached permissions (e.g., on logout)
     */
    const clearAllPermissions = useCallback((): void => {
        setPermissionCache({});
    }, []);

    return {
        verifyServiceAccess,
        invalidatePermission,
        clearAccountPermissions,
        clearAllPermissions
    };
};