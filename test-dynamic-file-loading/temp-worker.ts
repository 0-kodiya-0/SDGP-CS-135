// src/plugin/example-plugin/worker.ts
import * as Comlink from 'comlink';
import ExamplePluginBackground from './src/background';

// Declare the worker self type
// Self type declaration removed for bundling

// Create an instance of the background service
const pluginInstance = new ExamplePluginBackground();

// Export the API using Comlink
Comlink.expose(pluginInstance);

// Self.onconnect for shared workers
self.onconnect = (e) => {
    const port = e.ports[0];
    Comlink.expose(pluginInstance, port);
};