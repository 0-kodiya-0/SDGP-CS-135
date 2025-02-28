/* eslint-disable @typescript-eslint/no-explicit-any */
// src/plugin/counter-plugin/worker.ts
import * as Comlink from 'comlink';

class CounterPluginWorker {
    private count: number = 0;
    private incrementBy: number = 1;
    private lastUpdated: string = new Date().toISOString();
    private initialized: boolean = false;

    async setSettings(settings: Record<string, any>): Promise<void> {
        // Apply settings if provided
        if (settings.initialCount !== undefined) {
            this.count = settings.initialCount;
        }

        if (settings.incrementBy !== undefined) {
            this.incrementBy = settings.incrementBy;
        }

        console.log("Counter plugin settings applied:", settings);
        return Promise.resolve();
    }

    async initialize(): Promise<void> {
        // Perform any initialization here
        console.log("Counter plugin worker initialized");
        this.initialized = true;
        return Promise.resolve();
    }

    async getData(): Promise<any> {
        if (!this.initialized) {
            throw new Error('Plugin not initialized');
        }

        return {
            count: this.count,
            incrementBy: this.incrementBy,
            lastUpdated: this.lastUpdated
        };
    }

    async incrementCounter(): Promise<void> {
        this.count += this.incrementBy;
        this.lastUpdated = new Date().toISOString();
        console.log('Counter incremented to:', this.count);
        return Promise.resolve();
    }

    async resetCounter(): Promise<void> {
        this.count = 0;
        this.lastUpdated = new Date().toISOString();
        console.log('Counter reset to zero');
        return Promise.resolve();
    }
}

// Expose the class methods to the main thread using Comlink
Comlink.expose(new CounterPluginWorker());