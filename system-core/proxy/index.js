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

// Backend API routes proxy - anything that starts with /api/v1
const apiProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    logLevel: 'debug'
});

// Frontend routes proxy - everything else
const frontendProxy = createProxyMiddleware({
    target: FRONTEND_URL,
    changeOrigin: true,
    logLevel: 'debug'
});

// Apply proxies - order matters! More specific routes first
app.use('/api/v1', apiProxy);
app.use('/', frontendProxy);

// Start the proxy server
app.listen(PORT, () => {
    console.log(`Proxy Server running at http://localhost:${PORT}`);
    console.log(`Proxying API requests (/api/v1/*) to: ${BACKEND_URL}`);
    console.log(`Proxying all other requests to: ${FRONTEND_URL}`);
});