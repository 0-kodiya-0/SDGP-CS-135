import { useEffect } from 'react';
import { ComponentId } from '../types';
import componentRegistry from '../componentRegistry';

/**
 * Hook for registering a component with the registry
 */
export function useComponentRegistration(componentId: ComponentId) {
    useEffect(() => {
        // Register the component on mount
        componentRegistry.registerComponent(componentId);

        // Unregister the component on unmount
        return () => {
            componentRegistry.unregisterComponent(componentId);
        };
    }, [componentId]);

    return {
        isRegistered: componentRegistry.isComponentRegistered(componentId),
        recordInteraction: () => componentRegistry.recordInteraction(componentId)
    };
}