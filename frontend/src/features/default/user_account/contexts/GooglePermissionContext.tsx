import React, { createContext, useState, useCallback, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { API_BASE_URL, ApiResponse } from '../../../../conf/axios';
import { 
    PermissionContextValue, 
    PermissionState, 
    PermissionCacheEntry, 
    ServiceType, 
    ScopeLevel, 
    ServiceAccessResponse 
} from '../types/types.google.api';
import { getValidScopesForService } from '../utils/utils.google';

// Create the context
const PermissionContext = createContext<PermissionContextValue | null>(null);

// Provider component
export const GooglePermissionsProvider: React.FC<{
    children: React.ReactNode;
    defaultAccountId?: string | null;
}> = ({ children, defaultAccountId = null }) => {
    const [state, setState] = useState<PermissionState>({
        accountId: defaultAccountId,
        permissionsCache: {},
        pendingPermissions: {},
        isPopupOpen: false,
        currentPermissionRequest: null,
    });
    
    // Added state for tracking permissions loading and errors
    const [permissionsLoading, setPermissionsLoading] = useState<boolean>(false);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const popupRef = useRef<Window | null>(null);
    const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check if a cache entry is valid (currently we don't expire cache entries)
    const isCacheValid = useCallback((entry?: PermissionCacheEntry) => {
        if (!entry) return false;
        return entry.hasAccess;
    }, []);

    // Get permission from cache
    const getPermission = useCallback((
        accountId: string,
        service: ServiceType,
        scope: ScopeLevel
    ): PermissionCacheEntry | undefined => {
        return state.permissionsCache[accountId]?.[service]?.[scope];
    }, [state.permissionsCache]);

    // Check token service access
    const checkServiceAccess = useCallback(async (
        accountId: string,
        service: ServiceType,
        scopeLevels: ScopeLevel[]
    ): Promise<ServiceAccessResponse | null> => {
        try {
            // Build query parameters
            const queryParams = new URLSearchParams();
            queryParams.append('service', service);
            queryParams.append('scopeLevels', JSON.stringify(scopeLevels));

            const response = await axios.get<ApiResponse<ServiceAccessResponse>>(
                `${API_BASE_URL}/${accountId}/google/token/check?${queryParams.toString()}`,
                { withCredentials: true }
            );

            if (response.data.success && response.data.data) {
                return response.data.data;
            } else {
                console.error('Failed to check service access:', response.data.error);
                return null;
            }
        } catch (err) {
            console.error('Error checking service access:', err);
            return null;
        }
    }, []);

    // Check if permission is granted and update cache
    const checkServicePermission = useCallback(async (
        accountId: string,
        service: ServiceType,
        scope: ScopeLevel
    ): Promise<boolean> => {
        // Set pending permission
        const permissionKey = `${accountId}:${service}:${scope}`;

        // Skip if already pending to prevent duplicate calls
        if (state.pendingPermissions[permissionKey]) {
            console.log(`Skipping duplicate permission check for ${permissionKey}`);
            return false;
        }

        setState(prev => ({
            ...prev,
            pendingPermissions: {
                ...prev.pendingPermissions,
                [permissionKey]: true
            }
        }));

        console.log(`Checking permission for ${accountId}:${service}:${scope}`);

        try {
            // Check cache first
            const cachedPermission = getPermission(accountId, service, scope);
            if (isCacheValid(cachedPermission)) {
                return cachedPermission!.hasAccess;
            }

            console.log('Cached permission:', {
                service,
                scope,
                cachedPermission,
                isValid: isCacheValid(cachedPermission)
            });

            // If not in cache, check with the API
            const result = await checkServiceAccess(accountId, service, [scope]);
            const hasAccess = !!result?.scopeResults[scope]?.hasAccess;

            // Update cache
            setState(prev => {
                const newCache = { ...prev.permissionsCache };
                if (!newCache[accountId]) newCache[accountId] = {};
                if (!newCache[accountId][service]) newCache[accountId][service] = {};

                newCache[accountId][service][scope] = {
                    hasAccess,
                    lastChecked: Date.now()
                };

                console.log(`Updated permission cache for ${service}:${scope} - hasAccess: ${hasAccess}`);

                return {
                    ...prev,
                    permissionsCache: newCache,
                    pendingPermissions: {
                        ...prev.pendingPermissions,
                        [permissionKey]: false
                    }
                };
            });

            return hasAccess;
        } catch (error) {
            console.error(`Error checking ${service} ${scope} permission:`, error);

            // Clear pending state on error
            setState(prev => ({
                ...prev,
                pendingPermissions: {
                    ...prev.pendingPermissions,
                    [permissionKey]: false
                }
            }));

            return false;
        }
    }, [checkServiceAccess, getPermission, isCacheValid, state.pendingPermissions]);

    // Check if we have required permission
    const hasRequiredPermission = useCallback((
        accountId: string,
        service: ServiceType,
        scope: ScopeLevel
    ): boolean => {
        const permissions = state.permissionsCache[accountId]?.[service];

        // If we have full access, we have access to everything
        if (permissions?.['full']?.hasAccess === true) {
            return true;
        }

        // Check for the specific permission
        return permissions?.[scope]?.hasAccess === true;
    }, [state.permissionsCache]);

    // Close popup and clear any related timeouts
    const closePopup = useCallback(() => {
        if (popupRef.current) {
            try {
                popupRef.current.close();
            } catch (e) {
                console.error('Error closing popup:', e);
            }
            popupRef.current = null;
        }

        if (popupTimeoutRef.current) {
            clearTimeout(popupTimeoutRef.current);
            popupTimeoutRef.current = null;
        }
    }, []);

    // Open permission popup
    const openPermissionPopup = useCallback((
        accountId: string,
        service: ServiceType,
        scopes: ScopeLevel[]
    ): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            // Clean up any existing popup
            closePopup();

            // Format scopes as comma-separated string
            const scopeParam = scopes.join(',');

            // Create the permission URL with explicit callback
            const redirectUrl = encodeURIComponent(`${window.location.origin}/permission/callback`);
            const returnTo = encodeURIComponent(window.location.href);
            const url = `${API_BASE_URL}/oauth/permission/${service}/${scopeParam}?accountId=${accountId}&redirectUrl=${redirectUrl}&returnTo=${returnTo}`;

            // Set current permission request
            setState(prev => ({
                ...prev,
                isPopupOpen: true,
                currentPermissionRequest: {
                    service,
                    scopes,
                    onComplete: resolve
                }
            }));

            // Open popup window
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.outerWidth - width) / 2;
            const top = window.screenY + (window.outerHeight - height) / 2;

            popupRef.current = window.open(
                url,
                'googlePermission',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
            );

            // Check if popup was blocked
            if (!popupRef.current) {
                setState(prev => ({
                    ...prev,
                    isPopupOpen: false,
                    currentPermissionRequest: null
                }));

                console.error('Permission popup was blocked by the browser');
                reject(new Error('Permission popup was blocked. Please allow popups for this site.'));
                return;
            }

            // Set a maximum timeout (3 minutes)
            popupTimeoutRef.current = setTimeout(() => {
                closePopup();

                setState(prev => ({
                    ...prev,
                    isPopupOpen: false,
                    currentPermissionRequest: null
                }));

                resolve(false); // Resolve with false on timeout
            }, 180000); // 3 minutes
        });
    }, [closePopup]);

    // Request permissions for all missing scopes at once
    const requestPermissions = useCallback(async (
        accountId: string,
        service: ServiceType,
        scopes: ScopeLevel[],
        onComplete?: (success: boolean) => void
    ): Promise<boolean> => {
        // Filter for valid scopes
        const validScopes = scopes.filter(scope =>
            getValidScopesForService(service).includes(scope)
        );

        if (validScopes.length === 0) {
            if (onComplete) onComplete(true);
            return true;
        }

        try {
            // Open permission popup
            const result = await openPermissionPopup(accountId, service, validScopes);

            if (onComplete) {
                onComplete(result);
            }

            return result;
        } catch (error) {
            console.error('Error requesting permissions:', error);

            // Show an alert to the user about popup blocking
            if (error instanceof Error && error.message.includes('blocked')) {
                alert('Permission popup was blocked. Please allow popups for this site and try again.');
            }

            if (onComplete) {
                onComplete(false);
            }

            return false;
        }
    }, [openPermissionPopup]);

    // Invalidate a permission
    const invalidatePermission = useCallback((
        accountId: string,
        service: ServiceType,
        scope: ScopeLevel
    ): void => {
        setState(prev => {
            if (!prev.permissionsCache[accountId]?.[service]?.[scope]) {
                return prev;
            }

            const newCache = { ...prev.permissionsCache };
            newCache[accountId][service][scope].hasAccess = false;

            return {
                ...prev,
                permissionsCache: newCache
            };
        });
    }, []);

    // Clear all permissions for an account
    const clearAccountPermissions = useCallback((accountId: string): void => {
        setState(prev => {
            const newCache = { ...prev.permissionsCache };
            delete newCache[accountId];

            return {
                ...prev,
                permissionsCache: newCache
            };
        });
    }, []);

    // NEW FUNCTION: Check all service permissions for a service
    const checkAllServicePermissions = useCallback(async (
        accountId: string,
        serviceType: ServiceType,
        requestMissing: boolean = false
    ): Promise<boolean> => {
        if (!accountId) return false;

        setPermissionsLoading(true);
        setPermissionError(null);

        try {
            // Get valid scopes for this service
            const availableScopes = getValidScopesForService(serviceType);
            
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
                
                // Recheck permissions after requesting
                const newResults = await Promise.all(
                    availableScopes.map(scope => checkServicePermission(accountId, serviceType, scope))
                );
                
                return newResults.every(result => result === true);
            }

            return allGranted;
        } catch (error) {
            setPermissionError(error instanceof Error ? error.message : 'Failed to check permissions');
            return false;
        } finally {
            setPermissionsLoading(false);
        }
    }, [checkServicePermission, requestPermissions]);

    // Handle permission result and update cache
    const handlePermissionResult = useCallback(async (
        accountId: string,
        service: ServiceType,
        scopeLevel: ScopeLevel,
        success: boolean
    ) => {
        if (success) {
            // Update cache with new permission
            setState(prev => {
                const newCache = { ...prev.permissionsCache };
                if (!newCache[accountId]) newCache[accountId] = {};
                if (!newCache[accountId][service]) newCache[accountId][service] = {};

                newCache[accountId][service][scopeLevel] = {
                    hasAccess: true,
                    lastChecked: Date.now()
                };

                return {
                    ...prev,
                    permissionsCache: newCache
                };
            });
        } else {
            // Double-check with the API to verify current status
            await checkServicePermission(accountId, service, scopeLevel);
        }

        // Close dialog and call completion handler
        closePopup();

        if (state.currentPermissionRequest?.onComplete) {
            state.currentPermissionRequest.onComplete(success);
        }

        setState(prev => ({
            ...prev,
            isPopupOpen: false,
            currentPermissionRequest: null
        }));
    }, [checkServicePermission, closePopup, state.currentPermissionRequest]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // More permissive origin check for handling different environments
            const isTrustedOrigin = event.origin === window.location.origin ||
                event.origin.includes(new URL(API_BASE_URL).hostname);

            if (!isTrustedOrigin) return;

            // Check if message is a permission result
            const data = typeof event.data === 'object' ? event.data : {};

            if (data.type === 'GOOGLE_PERMISSION_RESULT') {
                const { success, service, scopeLevel } = data;

                if (service && scopeLevel && state.accountId) {
                    handlePermissionResult(
                        state.accountId,
                        service as ServiceType,
                        scopeLevel as ScopeLevel,
                        success === true
                    );
                }
            }
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
            closePopup();
        };
    }, [state.accountId]);

    // Also check if popup is closed manually
    useEffect(() => {
        if (!popupRef.current || !state.isPopupOpen) return;

        const checkPopupClosed = setInterval(() => {
            if (popupRef.current && popupRef.current.closed) {
                clearInterval(checkPopupClosed);

                // If popup was closed manually, treat as cancellation
                setState(prev => {
                    if (!prev.isPopupOpen) return prev; // Already handled

                    if (prev.currentPermissionRequest?.onComplete) {
                        prev.currentPermissionRequest.onComplete(false);
                    }

                    return {
                        ...prev,
                        isPopupOpen: false,
                        currentPermissionRequest: null
                    };
                });
            }
        }, 500);

        return () => clearInterval(checkPopupClosed);
    }, [state.isPopupOpen]);

    const contextValue: PermissionContextValue = {
        ...state,
        permissionsLoading,
        permissionError,
        checkServicePermission,
        requestPermissions,
        hasRequiredPermission,
        invalidatePermission,
        clearAccountPermissions,
        checkAllServicePermissions
    };

    return (
        <PermissionContext.Provider value={contextValue}>
            {children}
            {state.isPopupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full relative">
                        <button
                            onClick={() => {
                                closePopup();

                                // Call completion handler with failure
                                if (state.currentPermissionRequest?.onComplete) {
                                    state.currentPermissionRequest.onComplete(false);
                                }

                                // Update state
                                setState(prev => ({
                                    ...prev,
                                    isPopupOpen: false,
                                    currentPermissionRequest: null
                                }));
                            }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            aria-label="Close permission dialog"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>

                        <h3 className="text-lg font-medium mb-2">Requesting Access</h3>

                        <p className="text-sm text-gray-600 mb-4">
                            Complete the authorization in the popup window. If you don't see it,
                            check if it was blocked by your browser.
                        </p>

                        <div className="flex items-center justify-center space-x-2 my-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>

                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => {
                                    closePopup();

                                    if (state.currentPermissionRequest?.onComplete) {
                                        state.currentPermissionRequest.onComplete(false);
                                    }

                                    setState(prev => ({
                                        ...prev,
                                        isPopupOpen: false,
                                        currentPermissionRequest: null
                                    }));
                                }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PermissionContext.Provider>
    );
};

// Custom hook for using the permission context
export const useGooglePermissions = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('useGooglePermissions must be used within a GooglePermissionsProvider');
    }
    return context;
};