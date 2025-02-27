import { useState, useEffect, useCallback } from 'react';
import { ComponentId } from '../types';
import componentRegistry from '../componentRegistry';

/**
 * Hook for checking if a component is available
 */
export function useComponentAvailability(componentId: ComponentId) {
    const [isAvailable, setIsAvailable] = useState(() =>
        componentRegistry.isComponentRegistered(componentId)
    );

    // Check availability on mount and every 2 seconds
    useEffect(() => {
        const checkAvailability = () => {
            const available = componentRegistry.isComponentRegistered(componentId);
            setIsAvailable(available);
        };

        // Initial check
        checkAvailability();

        // Set up interval for checking
        const intervalId = setInterval(checkAvailability, 2000);

        return () => {
            clearInterval(intervalId);
        };
    }, [componentId]);

    // Method to force a check
    const checkAvailability = useCallback(() => {
        const available = componentRegistry.isComponentRegistered(componentId);
        setIsAvailable(available);
        return available;
    }, [componentId]);

    return {
        isAvailable,
        checkAvailability
    };
}