import { ComponentId, RegisteredComponent, ComponentRegistryInterface } from './types';

/**
 * Component Registry - tracks which UI components are active
 */
export class ComponentRegistry implements ComponentRegistryInterface {
    private components: Map<ComponentId, RegisteredComponent> = new Map();
    private readonly componentTimeout: number;

    constructor(options: { componentTimeout?: number } = {}) {
        this.componentTimeout = options.componentTimeout || 300000; // 5 minute default

        // Set up periodic cleanup of inactive components
        if (typeof setInterval !== 'undefined') {
            setInterval(() => this.cleanupInactiveComponents(), this.componentTimeout);
        }
    }

    /**
     * Register a UI component
     */
    registerComponent(componentId: ComponentId): boolean {
        // If already registered, just update timestamp
        if (this.components.has(componentId)) {
            const component = this.components.get(componentId)!;
            component.lastInteractionAt = Date.now();
            return true;
        }

        // Register new component
        this.components.set(componentId, {
            id: componentId,
            registeredAt: Date.now(),
            lastInteractionAt: Date.now()
        });

        console.log(`Component registered: ${componentId}`);
        return true;
    }

    /**
     * Unregister a UI component
     */
    unregisterComponent(componentId: ComponentId): boolean {
        const result = this.components.delete(componentId);
        if (result) {
            console.log(`Component unregistered: ${componentId}`);
        }
        return result;
    }

    /**
     * Check if a component is registered
     */
    isComponentRegistered(componentId: ComponentId): boolean {
        return this.components.has(componentId);
    }

    /**
     * Get all registered component IDs
     */
    getRegisteredComponentIds(): ComponentId[] {
        return Array.from(this.components.keys());
    }

    /**
     * Record an interaction with a component
     */
    recordInteraction(componentId: ComponentId): boolean {
        if (!this.components.has(componentId)) {
            return false;
        }

        const component = this.components.get(componentId)!;
        component.lastInteractionAt = Date.now();
        return true;
    }

    /**
     * Clean up inactive components
     */
    private cleanupInactiveComponents(): void {
        const now = Date.now();

        for (const [componentId, component] of this.components.entries()) {
            if (now - component.lastInteractionAt > this.componentTimeout) {
                this.components.delete(componentId);
                console.info(`Removed inactive component: ${componentId}`);
            }
        }
    }
}

// Create singleton instance
export const componentRegistry = new ComponentRegistry();

// Export singleton for use throughout the application
export default componentRegistry;