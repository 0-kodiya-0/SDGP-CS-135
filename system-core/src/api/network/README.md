# Network API Documentation

## Overview

The Network API provides a unified interface for making HTTP requests and managing WebSocket/Socket.IO connections in both the main application and plugins. It serves as a central communication hub for external network operations.

## Architecture

The Network API follows a modular architecture with these key components:

1. **Core Network Class**: The main implementation that handles all network operations
2. **NetworkApiWrapper**: A permission-controlled wrapper for plugins
3. **Custom Instance Registry**: Management system for plugin-specific axios and WebSocket instances

## File Structure

```
src/api/network/
├── index.ts                // Main export file
├── types.ts                // Type definitions and interfaces
├── networkCore.ts          // Core Network API implementation
├── providers/
│   ├── index.ts            // Provider exports
│   ├── http.ts             // HTTP (axios) provider
│   ├── websocket.ts        // WebSocket provider
│   └── socketio.ts         // Socket.IO provider
```

## Core Features

- HTTP request methods with axios
- Custom axios instance registration and management
- WebSocket connection creation and management
- Socket.IO support for real-time communication
- Namespaced resource handling for plugins

## API Reference

### Initialization

```typescript
import networkApi from '../api/network';

// Or create a custom instance with options
import { NetworkApi } from '../api/network';
const customNetworkApi = new NetworkApi({
  baseUrl: 'https://api.example.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});
```

### HTTP Requests

The Network API provides methods for all standard HTTP operations:

```typescript
// GET request
const users = await networkApi.get<User[]>('/api/users');

// POST request with data
const newUser = await networkApi.post<User>(
  '/api/users', 
  { name: 'John Doe', email: 'john@example.com' }
);

// PUT request
const updatedUser = await networkApi.put<User>(
  '/api/users/123', 
  { name: 'John Updated' }
);

// PATCH request
const partialUser = await networkApi.patch<User>(
  '/api/users/123', 
  { status: 'active' }
);

// DELETE request
await networkApi.delete('/api/users/123');

// Generic request with custom config
const data = await networkApi.request({
  method: 'GET',
  url: '/api/custom',
  params: { filter: 'recent' }
});
```

### Custom Axios Instance Management

The API allows registering and using custom axios instances:

```typescript
// Register a custom axios instance
const customAxios = axios.create({
  baseURL: 'https://api.specialservice.com',
  timeout: 10000,
  headers: {
    'X-API-Key': 'your-api-key'
  }
});

networkApi.registerAxiosInstance('special-service', customAxios);

// Use the custom instance for a request
const data = await networkApi.get('/endpoint', {}, 'special-service');

// Remove the custom instance when no longer needed
networkApi.unregisterAxiosInstance('special-service');
```

### WebSocket Management

Create and manage WebSocket connections:

```typescript
// Create a WebSocket connection
const wsConnection = networkApi.createWebSocket('wss://socket.example.com', 'notifications');

// Listen for events
wsConnection.on('message', (data) => {
  console.log('Received message:', data);
});

wsConnection.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Send a message
wsConnection.send('Hello server!');

// Retrieve an existing connection
const existingWs = networkApi.getWebSocket('notifications');

// Close the connection when done
wsConnection.close();
// or
networkApi.removeWebSocket('notifications');
```

### Socket.IO Support

Create and manage Socket.IO connections:

```typescript
// Create a Socket.IO connection
const socket = networkApi.createSocketIO(
  'https://realtime.example.com', 
  {
    transports: ['websocket'],
    reconnection: true
  },
  'realtime-updates'
);

// Listen for events
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});

socket.on('update', (data) => {
  console.log('Received update:', data);
});

// Emit an event
socket.emit('request-data', { type: 'recent' });

// Retrieve an existing connection
const existingSocket = networkApi.getSocketIO('realtime-updates');

// Disconnect when done
socket.disconnect();
// or
networkApi.removeSocketIO('realtime-updates');
```

### Authentication Helpers

Helper methods for managing authentication:

```typescript
// Set an auth token for all requests with the default axios instance
networkApi.setAuthToken('your-jwt-token');

// Clear the auth token when logging out
networkApi.clearAuthToken();
```

## Plugin Integration

The Network API is designed to be used by plugins through a permission-controlled wrapper. The wrapper ensures that:

1. Plugins can only perform network operations if they have the 'network' permission
2. Each plugin's resources (axios instances, WebSockets, Socket.IO connections) are isolated via namespacing
3. Plugins cannot access or modify other plugins' resources

### Plugin Manifest Example

```json
{
  "name": "Data Processor",
  "version": "1.0.0",
  "description": "Processes data from external APIs",
  "entryPoint": "/plugins/data-processor/index.js",
  "permissions": ["network"],
  "author": "Example Developer"
}
```

### Plugin Usage Example

```typescript
// Plugin code
export async function initialize() {
  // Register a custom axios instance
  const customAxios = axios.create({
    baseURL: 'https://api.service.com',
    timeout: 5000
  });
  
  apis.network.registerAxiosInstance('service-api', customAxios);
  
  // Make requests
  const data = await apis.network.get('/data', {}, 'service-api');
  
  // Set up a Socket.IO connection
  const socket = apis.network.createSocketIO('https://realtime.service.com', {}, 'updates');
  
  socket.on('update', (data) => {
    // Process updates...
  });
}

export function cleanup() {
  // Cleanup connections when plugin is unloaded
  apis.network.removeSocketIO('updates');
  apis.network.unregisterAxiosInstance('service-api');
}
```

## Security Considerations

### Permission System

The Network API uses a permission system to control access:

- The main application has unrestricted access to the NetworkApi
- Plugins must have the 'network' permission to use network operations
- All plugin operations are wrapped to enforce permission checks

### Resource Isolation

Resources are isolated between plugins through namespacing:

- When a plugin registers a resource (axios instance, WebSocket, etc.), the ID is prefixed with the plugin's ID
- Plugins can only access resources they created
- This prevents plugins from accessing or modifying other plugins' resources

### Request Limits

Consider implementing these additional security measures:

- Rate limiting for plugin requests
- Request quotas
- Domain allowlists and blocklists
- Response size limitations

## Error Handling

The Network API includes built-in error handling:

```typescript
try {
  const data = await networkApi.get('/api/data');
  // Process data...
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle Axios-specific errors
    if (error.response) {
      // Server responded with an error status
      console.error('Server error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - no response received');
    } else {
      // Request setup error
      console.error('Request error:', error.message);
    }
  } else {
    // Handle non-Axios errors
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

### Connection Management

1. **Always close connections when done**
   - Use `socket.disconnect()` for Socket.IO connections
   - Use `websocket.close()` for WebSocket connections
   - Or use the remove methods: `removeSocketIO()` and `removeWebSocket()`

2. **Handle reconnections gracefully**
   - Set appropriate reconnection options for Socket.IO
   - Implement reconnection logic for WebSockets if needed

### Resource Cleanup

Always clean up resources to prevent memory leaks:

```typescript
// When unregistering a plugin or when connections are no longer needed
networkApi.unregisterAxiosInstance('instance-id');
networkApi.removeWebSocket('websocket-id');
networkApi.removeSocketIO('socketio-id');
```

### Error Handling

Implement comprehensive error handling for all network operations:

```typescript
try {
  await networkApi.post('/api/important-data', data);
} catch (error) {
  // Log the error
  console.error('Failed to send important data:', error);
  
  // Provide user feedback
  notifyUser('Failed to send data. Please try again later.');
  
  // Possibly retry the operation
  scheduleRetry(() => sendImportantData(data));
}
```

## Implementation Details

The Network API is built on these core libraries:

- **axios**: For HTTP requests
- **WebSocket API**: For WebSocket connections
- **Socket.IO client**: For Socket.IO connections

## Provider Implementations

### HTTP Provider (`http.ts`)

The HTTP provider uses axios to handle all HTTP requests and provides:

- Registration and management of custom axios instances
- Methods for all standard HTTP operations (GET, POST, PUT, PATCH, DELETE)
- Authentication management
- Default error handling

### WebSocket Provider (`websocket.ts`)

The WebSocket provider manages browser WebSocket connections and provides:

- Creation and management of WebSocket connections
- Event handling for WebSocket events (message, error, close)
- Connection state management
- Automatic cleanup of closed connections

### Socket.IO Provider (`socketio.ts`)

The Socket.IO provider manages Socket.IO connections and provides:

- Creation and management of Socket.IO connections
- Event handling for Socket.IO events
- Connection state management
- Automatic cleanup of disconnected connections

## Conclusion

The Network API provides a robust, secure, and flexible interface for all network operations in the application and its plugins. By centralizing network communication, it ensures consistent behavior, proper error handling, and resource isolation between plugins.