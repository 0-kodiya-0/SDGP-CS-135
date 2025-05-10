import React, { lazy, Suspense } from 'react';
import { registerCalendarComponents } from '../../../default/calender';
import { registerContactComponents } from '../../../default/contacts/utils/registerContactComponents';
import { registerFilesComponents } from '../../../default/files/utils/registerFilesComponents';
import { registerChatComponents } from '../../../default/chat';
import { registerEmailComponents } from '../../../default/mail/utils/registerEmailComponents';

// Type for the registry
interface ComponentRegistry {
  [key: string]: React.LazyExoticComponent<React.ComponentType<any>>;
}

// The registry maps component names to their lazy-loaded implementations
const componentRegistry: ComponentRegistry = {};

/**
 * Register a component for dynamic loading
 * @param name The unique identifier for the component (use ComponentTypes enum)
 * @param importFn Function that imports the component
 */
export function registerComponent(name: string, importFn: () => Promise<{ default: React.ComponentType<any> }>) {
  componentRegistry[name] = lazy(importFn);
  console.log(`Registered component: ${name}`);
}

/**
 * Get a component by name from the registry
 * @param name The component name to retrieve
 * @returns The lazy-loaded component or undefined if not found
 */
export function getComponent(name: string) {
  return componentRegistry[name];
}

/**
 * Component that dynamically loads a component from the registry
 */
export const ComponentLoader: React.FC<{
  componentType: string;
  props?: Record<string, any>;
}> = ({ componentType, props = {} }) => {
  const Component = getComponent(componentType);

  if (!Component) {
    console.error(`Component "${componentType}" not found in registry`);
    return <div className="p-4 text-red-500">Failed to load component: {componentType}</div>;
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <span>Loading component...</span>
      </div>
    }>
      <Component {...props} />
    </Suspense>
  );
};

/**
 * Register all application components for dynamic loading
 * This function should be called during app initialization
 */
export function registerAllComponents() {
  // Register components from each feature
  registerCalendarComponents();
  registerContactComponents();
  registerEmailComponents();
  registerFilesComponents();
  registerChatComponents();
  
  // Add calls to other feature registration functions here
  // registerDashboardComponents();
  // registerChatComponents();
  
  console.log('All application components registered for dynamic loading');
}