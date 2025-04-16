const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

// Configuration
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const PORT = process.env.PROXY_PORT || 8080;

const app = express();

// Logging middleware
app.use((req, res, next) => {
    console.log(`[PROXY] ${req.method} ${req.url}`);
    next();
});

// Backend API proxy configuration with WebSocket support
const apiProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    // ws: true, // Enable WebSocket proxying
    logLevel: 'debug',
    on : {
        proxyReq: (proxyReq, req, res) => {
            // Preserve the original host in X-Forwarded-Host
            if (req.headers.host) {
                proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
            }
            
            // Add X-Forwarded-Proto header if not present
            if (!req.headers['x-forwarded-proto']) {
                proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
            }
        },
        // proxyReqWs: (proxyReq, req, socket, options, head) => {
        //     // Add headers for WebSocket requests too
        //     if (req.headers.host) {
        //         proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
        //     }
            
        //     // You can add more WebSocket-specific headers here if needed
        //     console.log('[PROXY] WebSocket connection proxied');
        // },
        error: (err, req, res) => {
            console.error('[PROXY] Error:', err, req.url);
            if (res.writeHead && !res.headersSent) {
                res.writeHead(500);
                res.end('Proxy error: ' + err.message);
            }
        }   
    }
});

// Create a dedicated Socket.IO proxy with explicit configuration
const socketIOProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
    pathRewrite: null, // Explicitly do not rewrite paths
    on: {
        proxyReq: (proxyReq, req, res) => {
            console.log('[PROXY-SOCKET] Original URL:', req.url);
            console.log('[PROXY-SOCKET] Target URL:', proxyReq.path);
            if (req.headers.host) {
                proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
            }
            
            if (!req.headers['x-forwarded-proto']) {
                proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
            }
        },
        error: (err, req, res) => {
            console.error('[PROXY-SOCKET] Error:', err);
            if (res.writeHead && !res.headersSent) {
                res.writeHead(500);
                res.end('Socket.IO proxy error: ' + err.message);
            }
        }
    }
});

// Frontend proxy configuration
const frontendProxy = createProxyMiddleware({
    target: FRONTEND_URL,
    changeOrigin: true,
    logLevel: 'debug',
    on: {
        proxyReq: (proxyReq, req, res) => {
            // Preserve the original host in X-Forwarded-Host
            if (req.headers.host) {
                proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
            }
            
            // Add X-Forwarded-Proto header if not present
            if (!req.headers['x-forwarded-proto']) {
                proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
            }
        },
        error: (err, req, res) => {
            console.error('[PROXY] Frontend Error:', err);
            if (res.writeHead && !res.headersSent) {
                res.writeHead(500);
                res.end('Frontend proxy error: ' + err.message);
            }
        }
    }
});

// Apply proxies - order matters! More specific routes first
app.use('/api/v1', apiProxy);
app.use('/socket.io', socketIOProxy);
app.use('/', frontendProxy);

// Start the proxy server
const server = app.listen(PORT, () => {
    console.log(`Proxy Server running at http://localhost:${PORT}`);
    console.log(`Proxying API requests (/api/v1/*) to: ${BACKEND_URL}`);
    console.log(`Proxying WebSocket requests (/socket.io/*) to: ${BACKEND_URL}`);
    console.log(`Proxying all other requests to: ${FRONTEND_URL}`);
});

// Upgrade WebSocket connections
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/socket.io')) {
        console.log('[PROXY] Upgrading WebSocket connection:', req.url);
        apiProxy.upgrade(req, socket, head);
    }
});