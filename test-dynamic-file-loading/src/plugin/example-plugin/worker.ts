/* eslint-disable @typescript-eslint/no-explicit-any */
// src/plugin/example-plugin/worker.ts
import * as Comlink from 'comlink';

class ExamplePluginWorker {
  private counter: number = 0;
  private interval: any = null;
  private settings: Record<string, any> = {};
  private initialized: boolean = false;

  async setSettings(settings: Record<string, any>): Promise<void> {
    this.settings = settings;
    console.log("Example plugin settings applied:", settings);
    return Promise.resolve();
  }

  async initialize(): Promise<void> {
    // Perform any initialization here
    console.log("Example plugin background service initialized");
    this.startBackgroundProcess();
    this.initialized = true;
    return Promise.resolve();
  }

  private startBackgroundProcess() {
    // Clear any existing interval
    if (this.interval !== null) {
      clearInterval(this.interval);
    }

    // Set up a simple counter that increments every second
    const refreshInterval = this.settings.refreshInterval || 1000;
    this.interval = setInterval(() => {
      this.counter++;
    }, refreshInterval);

    console.log(`Background process started with ${refreshInterval}ms interval`);
  }

  async getData(): Promise<any> {
    if (!this.initialized) {
      throw new Error('Plugin not initialized');
    }
    
    return {
      counter: this.counter,
      timestamp: new Date().toISOString(),
      randomValue: Math.random() * 10
    };
  }
}

// Expose the class methods to the main thread using Comlink
Comlink.expose(new ExamplePluginWorker());