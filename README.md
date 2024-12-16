# Electron Backend Guide

## Table of Contents

- [Electron Backend Guide](#electron-backend-guide)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Architecture](#architecture)
    - [Process Structure](#process-structure)
    - [Key Components](#key-components)
  - [IPC Communication](#ipc-communication)
    - [Implementation Example](#implementation-example)
    - [Communication Patterns](#communication-patterns)
  - [Server Integration](#server-integration)
    - [Local Server Options](#local-server-options)
    - [Pros and Cons](#pros-and-cons)
      - [Local Server Pros](#local-server-pros)
      - [Local Server Cons](#local-server-cons)
  - [Security Guidelines](#security-guidelines)
    - [IPC Security](#ipc-security)
    - [API Security](#api-security)
  - [Best Practices](#best-practices)
    - [Error Handling](#error-handling)
    - [Resource Management](#resource-management)
  - [Implementation Guidelines](#implementation-guidelines)
    - [API Calls](#api-calls)
  - [Change Request Process](#change-request-process)
    - [Backend Change Request Template](#backend-change-request-template)
  - [Notes](#notes)

## Overview

Electron backend handles system-level operations, API interactions, and data processing while maintaining secure communication with the frontend. This guide outlines the architecture and implementation guidelines.

## Architecture

### Process Structure

```
Electron App
├── Main Process (Node.js)
│   ├── System Operations
│   ├── File System Access
│   └── Network Requests
├── Renderer Process (React)
│   ├── UI Components
│   ├── State Management
│   └── User Interactions
└── IPC Bridge
    ├── Event Handlers
    └── Communication Channels
```

### Key Components

1. **Main Process**
   - Single instance
   - Full Node.js access
   - System-level operations
   - Network handling

2. **Renderer Process**
   - Multiple instances possible
   - Sandboxed environment
   - UI rendering
   - Limited system access

## IPC Communication

### Implementation Example

```typescript
// main.ts (Main Process)
import { ipcMain } from 'electron';

ipcMain.handle('data:fetch', async (event, args) => {
  try {
    const result = await fetchDataFromServer(args);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// preload.ts (Preload Script)
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  fetchData: (args: any) => ipcRenderer.invoke('data:fetch', args)
});

// Component.tsx (Renderer Process)
const handleDataFetch = async () => {
  const result = await window.electronAPI.fetchData({ id: 1 });
  // Handle result
};
```

### Communication Patterns

1. **Request-Response**
   - One-time requests
   - Async operations
   - Error handling

2. **Pub-Sub**
   - Continuous updates
   - Status monitoring
   - Event broadcasting

## Server Integration

### Local Server Options

1. **Express Server**

```typescript
import express from 'express';
import { app } from 'electron';

const startLocalServer = () => {
  const server = express();
  const PORT = 3000;

  server.listen(PORT, () => {
    console.log(`Local server running on port ${PORT}`);
  });
};
```

2. **Socket Server**

```typescript
import { Server } from 'socket.io';
import { createServer } from 'http';

const startSocketServer = () => {
  const httpServer = createServer();
  const io = new Server(httpServer);
  
  io.on('connection', (socket) => {
    // Handle socket connections
  });
};
```

### Pros and Cons

#### Local Server Pros

- Reduced latency
- Offline functionality
- Direct system access
- Better resource control

#### Local Server Cons

- Resource consumption
- Port conflicts
- Security considerations
- Additional complexity

## Security Guidelines

### IPC Security

1. **Input Validation**

```typescript
const validateInput = (data: unknown): boolean => {
  // Implement validation logic
  return true;
};

ipcMain.handle('data:process', async (event, data) => {
  if (!validateInput(data)) {
    throw new Error('Invalid input');
  }
  // Process data
});
```

2. **Context Isolation**

```typescript
// main.ts
const createWindow = () => {
  const win = new BrowserWindow({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
};
```

### API Security

1. **Request Sanitization**

```typescript
const sanitizeRequest = (req: any) => {
  // Remove sensitive data
  // Validate parameters
  return sanitizedRequest;
};
```

2. **Response Filtering**

```typescript
const filterResponse = (res: any) => {
  // Remove sensitive data
  return filteredResponse;
};
```

## Best Practices

### Error Handling

```typescript
ipcMain.handle('operation:execute', async (event, args) => {
  try {
    // Perform operation
    return { success: true, data };
  } catch (error) {
    console.error('Operation failed:', error);
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code
      }
    };
  }
});
```

### Resource Management

1. **Memory Management**
   - Clean up unused resources
   - Monitor memory usage
   - Implement garbage collection

2. **Connection Pooling**
   - Reuse connections
   - Limit concurrent connections
   - Implement timeouts

## Implementation Guidelines

### API Calls

1. **Rate Limiting**

```typescript
class RateLimiter {
  private requests: number = 0;
  private timeWindow: number = 60000; // 1 minute

  canMakeRequest(): boolean {
    // Implement rate limiting logic
    return true;
  }
}
```

2. **Caching**

```typescript
const cache = new Map<string, { data: any; timestamp: number }>();

const getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < 5000) {
    return cached.data;
  }
  return null;
};
```

## Change Request Process

### Backend Change Request Template

```markdown
---
name: Backend Change Request
about: Suggest changes to backend architecture
title: ''
labels: 'backend'
assignees: ''

---

**Describe the change**
A clear description of the proposed backend change.

**Security Implications**
- List security considerations
- Impact on existing security measures
- New security requirements

**Performance Impact**
- Resource usage changes
- Scalability considerations
- Performance optimization needs

**Migration Strategy**
- Steps for implementation
- Backward compatibility
- Testing requirements
```

## Notes

- Always prioritize security in IPC communication
- Implement proper error handling
- Monitor resource usage
- Maintain clear documentation
- Follow the principle of least privilege
- Regular security audits
- Performance monitoring

---