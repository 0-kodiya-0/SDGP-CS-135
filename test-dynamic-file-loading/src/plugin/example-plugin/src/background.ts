/* eslint-disable @typescript-eslint/no-explicit-any */
import { PluginAPI } from '../../types/plugin.types';

class ExamplePluginBackground implements PluginAPI {
    private counter: number = 0;
    private intervalId: number | null = null;
    private settings: Record<string, any> = {};

    async initialize(): Promise<void> {
        console.log('Example plugin background service initialized');

        // Start a counter that increments every second
        this.intervalId = setInterval(() => {
            this.counter++;
        }, this.settings.refreshInterval || 1000) as unknown as number;

        return Promise.resolve();
    }

    async getData(): Promise<any> {
        return {
            counter: this.counter,
            timestamp: new Date().toISOString(),
            randomValue: Math.random() * 100
        };
    }

    setSettings(settings: Record<string, any>): void {
        this.settings = settings;
    }

    cleanup(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
        }
    }
}

export default ExamplePluginBackground;