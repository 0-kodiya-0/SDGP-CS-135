import EventEmitter from 'eventemitter3';
import { EventMap } from './types';

/**
 * EventBus: A singleton typed event emitter for application-wide events
 */
class EventBus extends EventEmitter<keyof EventMap, EventMap> {
    private static instance: EventBus;

    /**
     * Private constructor to prevent direct instantiation
     */
    private constructor() {
        super();
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
}

// Export a default instance
export default EventBus.getInstance();