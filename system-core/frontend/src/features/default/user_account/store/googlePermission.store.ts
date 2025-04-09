import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ScopeLevel, ServiceType, PermissionCache, PermissionCacheEntry } from '../types/types.google.api';

interface GooglePermissionsState {
  permissionCache: PermissionCache;

  // Actions
  updateCache: (
    accountId: string,
    service: ServiceType,
    scopeLevel: ScopeLevel,
    hasAccess: boolean
  ) => void;

  invalidatePermission: (
    accountId: string,
    service: ServiceType,
    scopeLevel: ScopeLevel
  ) => void;

  clearAccountPermissions: (accountId: string) => void;
  clearAllPermissions: () => void;

  // Helper functions
  isCacheValid: (entry?: PermissionCacheEntry) => boolean;
  getPermission: (
    accountId: string,
    service: ServiceType,
    scopeLevel: ScopeLevel
  ) => PermissionCacheEntry | undefined;
}

export const useGooglePermissionsStore = create<GooglePermissionsState>()(
  persist(
    (set, get) => ({
      permissionCache: {},

      // Check if cache entry exists and is valid
      // We now rely on error responses to invalidate the cache, not time-based expiration
      isCacheValid: (entry?: PermissionCacheEntry): boolean => {
        if (!entry) return false;
        return entry.hasAccess;
      },

      // Get a permission from the cache
      getPermission: (
        accountId: string,
        service: ServiceType,
        scopeLevel: ScopeLevel
      ): PermissionCacheEntry | undefined => {
        const { permissionCache } = get();
        return permissionCache[accountId]?.[service]?.[scopeLevel];
      },

      // Update the permission cache with new values
      updateCache: (
        accountId: string,
        service: ServiceType,
        scopeLevel: ScopeLevel,
        hasAccess: boolean
      ): void => {
        set(state => {
          const newCache = { ...state.permissionCache };

          // Create nested structure if needed
          if (!newCache[accountId]) newCache[accountId] = {};
          if (!newCache[accountId][service]) newCache[accountId][service] = {};

          // Update the specific permission
          // We still track lastChecked for debugging purposes, but don't use it for validation
          newCache[accountId][service][scopeLevel] = {
            hasAccess,
            lastChecked: Date.now()
          };

          return { permissionCache: newCache };
        });
      },

      // Invalidate a permission when it's no longer valid
      invalidatePermission: (
        accountId: string,
        service: ServiceType,
        scopeLevel: ScopeLevel
      ): void => {
        set(state => {
          if (!state.permissionCache[accountId]?.[service]?.[scopeLevel]) {
            return state;
          }

          const newCache = { ...state.permissionCache };
          newCache[accountId][service][scopeLevel].hasAccess = false;

          return { permissionCache: newCache };
        });
      },

      // Clear all cached permissions for a specific account
      clearAccountPermissions: (accountId: string): void => {
        set(state => {
          const newCache = { ...state.permissionCache };
          delete newCache[accountId];

          return { permissionCache: newCache };
        });
      },

      // Clear all cached permissions (e.g., on logout)
      clearAllPermissions: (): void => {
        set({ permissionCache: {} });
      }
    }),
    {
      name: 'google-permissions-storage',
      version: 1
    }
  )
);

export const usePermissionsCacheState = (accountId: string | null, service: ServiceType) => (state: GooglePermissionsState) => accountId ? state.permissionCache[accountId]?.[service] : null