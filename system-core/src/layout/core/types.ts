export type ComponentId = string;
export type CallerId = string;

/**
 * Information about a registered component
 */
export interface RegisteredComponent {
    id: ComponentId;
    registeredAt: number;
    lastInteractionAt: number;
}

/**
 * Component Registry Interface
 */
export interface ComponentRegistryInterface {
    // Component registration
    registerComponent(componentId: ComponentId): boolean;
    unregisterComponent(componentId: ComponentId): boolean;
    isComponentRegistered(componentId: ComponentId): boolean;
    getRegisteredComponentIds(): ComponentId[];

    // Record component interaction
    recordInteraction(componentId: ComponentId): boolean;
}