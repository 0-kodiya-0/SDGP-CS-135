# Permission Manager Documentation

The Permission Manager is a core component of our plugin system that handles plugin registration and permission enforcement. It provides a secure way to manage plugin permissions in memory during runtime, allowing for dynamic modification of permissions without requiring persistence.

## Core Features

- **Plugin Registration**: Register and unregister plugins with their manifests
- **Permission Checking**: Validate if a plugin has permission for specific operations
- **Dynamic Permissions**: Add or remove permissions at runtime
- **Wildcard Support**: Handle wildcard patterns in permission strings
- **In-Memory Operation**: All permission management happens in memory

## Permission Format

Permissions follow the format `resource:operation:target` where:

- **resource**: The type of resource being accessed (storage, network, state, etc.)
- **operation**: The action being performed (read, write, fetch, etc.)
- **target**: The specific target of the operation (namespace, domain, path, etc.)

Examples:
- `storage:read:app-data` - Permission to read from the "app-data" storage namespace
- `network:fetch:api.example.com` - Permission to make network requests to api.example.com
- `state:write:pluginState` - Permission to write to the "pluginState" state path

## Usage Examples

### 1. Registering a Plugin

```typescript
import { permissionManager } from '../api/communication/permissions/permissionManager';

// Plugin manifest with permissions
const manifest = {
  name: "Example Plugin",
  version: "1.0.0",
  description: "An example plugin",
  entryPoint: "/plugins/example-plugin/index.js",
  permissions: [
    "storage:read:app-data",
    "storage:write:plugin-data",
    "network:fetch:api.example.com"
  ],
  apiVersion: "1.0",
  author: "Example Developer"
};

// Register plugin with the permission manager
const pluginId = "example-plugin";
const registered = permissionManager.registerPlugin(pluginId, manifest);

if (registered) {
  console.log(`Plugin ${pluginId} registered successfully`);
} else {
  console.error(`Failed to register plugin ${pluginId}`);
}
```

### 2. Checking Permissions

```typescript
import { permissionManager } from '../api/communication/permissions/permissionManager';

const pluginId = "example-plugin";
const permission = "storage:read:app-data";

// Check if a plugin has a specific permission
if (permissionManager.hasPermission(pluginId, permission)) {
  console.log(`Plugin ${pluginId} has permission: ${permission}`);
} else {
  console.log(`Plugin ${pluginId} does not have permission: ${permission}`);
}

// Check for a permission with a different target
const otherPermission = "storage:read:user-data";
if (permissionManager.hasPermission(pluginId, otherPermission)) {
  // This won't execute if the plugin only has "storage:read:app-data"
  console.log(`Plugin ${pluginId} has permission: ${otherPermission}`);
}

// Check with wildcard permission
// If the plugin has "storage:*:plugin-data", this will return true for:
// "storage:read:plugin-data", "storage:write:plugin-data", etc.
const wildcardCheck = permissionManager.hasPermission(pluginId, "storage:read:plugin-data");
```

### 3. Dynamic Permission Management

```typescript
import { permissionManager } from '../api/communication/permissions/permissionManager';

const pluginId = "example-plugin";

// Add a new permission at runtime
const newPermission = "network:fetch:api.newservice.com";
const added = permissionManager.addPermission(pluginId, newPermission);

if (added) {
  console.log(`Added permission ${newPermission} to plugin ${pluginId}`);
}

// Remove a permission at runtime
const permissionToRemove = "network:fetch:api.example.com";
const removed = permissionManager.removePermission(pluginId, permissionToRemove);

if (removed) {
  console.log(`Removed permission ${permissionToRemove} from plugin ${pluginId}`);
  
  // Verify the permission was removed
  const hasPermission = permissionManager.hasPermission(pluginId, permissionToRemove);
  console.log(`Plugin still has permission? ${hasPermission}`); // Should be false
}
```

### 4. Getting Plugin Permissions

```typescript
import { permissionManager } from '../api/communication/permissions/permissionManager';

const pluginId = "example-plugin";

// Get all permissions for a plugin
const permissions = permissionManager.getPluginPermissions(pluginId);

if (permissions) {
  console.log(`Plugin ${pluginId} has these permissions:`, permissions);
} else {
  console.log(`Plugin ${pluginId} is not registered`);
}
```

### 5. Unregistering a Plugin

```typescript
import { permissionManager } from '../api/communication/permissions/permissionManager';

const pluginId = "example-plugin";

// Unregister a plugin when it's no longer needed
const unregistered = permissionManager.unregisterPlugin(pluginId);

if (unregistered) {
  console.log(`Plugin ${pluginId} unregistered successfully`);
} else {
  console.log(`Failed to unregister plugin ${pluginId}`);
}

// Verify the plugin is no longer registered
const isRegistered = permissionManager.isPluginRegistered(pluginId);
console.log(`Is plugin still registered? ${isRegistered}`); // Should be false
```

### 6. Integration with API Wrappers

```typescript
import { permissionManager } from '../api/communication/permissions/permissionManager';
import { StorageApiWrapper } from '../api/communication/wrappers/apiWrapperFactory';
import { storageApi } from '../api/storage';

const pluginId = "example-plugin";

// Create a storage API wrapper for the plugin
const storageWrapper = new StorageApiWrapper(storageApi, pluginId);

async function accessStorage() {
  try {
    // This will only succeed if the plugin has "storage:read:app-data" permission
    const data = await storageWrapper.get("app-data", "settings");
    console.log("Retrieved data:", data);
    
    // This will only succeed if the plugin has "storage:write:plugin-data" permission
    await storageWrapper.set("plugin-data", "preferences", { theme: "dark" });
    console.log("Data saved successfully");
    
    // This will fail if the plugin doesn't have "storage:read:user-data" permission
    await storageWrapper.get("user-data", "profile");
  } catch (error) {
    console.error("Permission error:", error.message);
    // Error will be something like:
    // "Permission denied: Plugin 'example-plugin' is not allowed to perform operation 'storage:read:user-data'"
  }
}
```

### 7. Checking for Multiple Registered Plugins

```typescript
import { permissionManager } from '../api/communication/permissions/permissionManager';

// Get all registered plugin IDs
const pluginIds = permissionManager.getRegisteredPluginIds();
console.log("Registered plugins:", pluginIds);

// Check permissions across multiple plugins
for (const pluginId of pluginIds) {
  const canAccessStorage = permissionManager.hasPermission(pluginId, "storage:read:app-data");
  const canAccessNetwork = permissionManager.hasPermission(pluginId, "network:fetch:api.example.com");
  
  console.log(`Plugin ${pluginId}:`);
  console.log(`- Can access app-data storage: ${canAccessStorage}`);
  console.log(`- Can make network requests to api.example.com: ${canAccessNetwork}`);
}
```

## React Component Integration

Here's an example of integrating permission management into a React component:

```tsx
import React, { useState, useEffect } from 'react';
import { permissionManager } from '../api/communication/permissions/permissionManager';

function PluginPermissionsPanel({ pluginId }) {
  const [permissions, setPermissions] = useState([]);
  const [newPermission, setNewPermission] = useState('');
  
  // Load plugin permissions on mount
  useEffect(() => {
    const pluginPermissions = permissionManager.getPluginPermissions(pluginId);
    if (pluginPermissions) {
      setPermissions(pluginPermissions);
    }
  }, [pluginId]);
  
  // Add a new permission
  const handleAddPermission = () => {
    if (newPermission && permissionManager.addPermission(pluginId, newPermission)) {
      setPermissions(permissionManager.getPluginPermissions(pluginId) || []);
      setNewPermission('');
    }
  };
  
  // Remove a permission
  const handleRemovePermission = (permission) => {
    if (permissionManager.removePermission(pluginId, permission)) {
      setPermissions(permissionManager.getPluginPermissions(pluginId) || []);
    }
  };
  
  return (
    <div className="plugin-permissions-panel">
      <h3>Plugin Permissions</h3>
      
      <ul className="permissions-list">
        {permissions.map(permission => (
          <li key={permission} className="permission-item">
            <span>{permission}</span>
            <button 
              onClick={() => handleRemovePermission(permission)}
              className="remove-btn"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      
      <div className="add-permission-form">
        <input
          type="text"
          value={newPermission}
          onChange={(e) => setNewPermission(e.target.value)}
          placeholder="resource:operation:target"
        />
        <button onClick={handleAddPermission}>Add Permission</button>
      </div>
    </div>
  );
}
```

## Best Practices

1. **Least Privilege**: Grant plugins only the permissions they absolutely need.

2. **Fine-Grained Permissions**: Use specific targets rather than wildcards when possible:
   - Prefer `storage:read:plugin-settings` over `storage:read:*`
   - Prefer `network:fetch:api.example.com` over `network:fetch:*`

3. **Dynamic Permission Control**: Use the ability to add/remove permissions at runtime for temporary elevated access:
   ```typescript
   // Give temporary permission for a specific operation
   permissionManager.addPermission(pluginId, "network:fetch:api.special.com");
   
   try {
     // Perform the operation
     await performSpecialOperation();
   } finally {
     // Always remove the permission afterward
     permissionManager.removePermission(pluginId, "network:fetch:api.special.com");
   }
   ```

4. **Permission Auditing**: Add logging for permission changes to track when permissions are added or removed:
   ```typescript
   const originalAddPermission = permissionManager.addPermission;
   permissionManager.addPermission = function(pluginId, permission) {
     console.log(`[AUDIT] Adding permission ${permission} to plugin ${pluginId}`);
     return originalAddPermission.call(this, pluginId, permission);
   };
   ```

5. **User Confirmation**: For sensitive permissions, consider asking for user confirmation:
   ```typescript
   async function requestPermission(pluginId, permission, reason) {
     const userConfirmed = await showPermissionDialog(
       `Plugin "${pluginId}" is requesting permission: ${permission}`,
       `Reason: ${reason}`
     );
     
     if (userConfirmed) {
       return permissionManager.addPermission(pluginId, permission);
     }
     return false;
   }
   ```

By following these guidelines and utilizing the Permission Manager effectively, you can create a secure and flexible plugin ecosystem that protects both your application and your users.