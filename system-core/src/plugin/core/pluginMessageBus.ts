import eventBus from "../../events";
import pluginRegistry from "./pluginRegistry";
import { PluginId, RegisteredPlugin } from "./types";
import { PluginMessageEvent } from "./types.event";
import { PluginMessage, MessageTarget } from "./types.message";

/**
 * Plugin Message Bus - Simple messaging system for plugin components
 * 
 * Enables communication between components within a single plugin
 * (background script and views)
 */
export class PluginMessageBus {
    private static instance: PluginMessageBus;

    private constructor() {
        console.log('Plugin message bus initialized');

        // Listen for messages from views (via window.postMessage)
        window.addEventListener('message', this.handleWindowMessage.bind(this));
    }

    /**
     * Get the singleton instance of the PluginMessageBus
     */
    public static getInstance(): PluginMessageBus {
        if (!PluginMessageBus.instance) {
            PluginMessageBus.instance = new PluginMessageBus();
        }
        return PluginMessageBus.instance;
    }

    /**
     * Send a message from one plugin component to another
     * 
     * @param pluginId Plugin ID
     * @param source Source component ID (background, summary, expand, or view ID)
     * @param target Target component (background, summary, expand, all-views, or view ID)
     * @param topic Message topic
     * @param payload Message payload
     * @returns Promise resolving to true if message was delivered successfully
     */
    public async sendMessage<T>(
        pluginId: PluginId,
        source: string,
        target: string,
        topic: string,
        payload: T
    ): Promise<boolean> {
        try {
            // Verify plugin exists in registry
            if (!pluginRegistry.isPluginRegistered(pluginId)) {
                console.error(`Cannot send message: Plugin ${pluginId} is not registered`);
                return false;
            }

            // Create message object
            const message: PluginMessage<T> = {
                id: this.generateMessageId(),
                pluginId,
                source,
                target,
                topic,
                payload,
                timestamp: Date.now()
            };

            // Emit event for monitoring
            eventBus.emit('pluginMessage', {
                pluginId,
                type: topic,
                payload: {
                    source,
                    target
                },
                timestamp: message.timestamp
            } as PluginMessageEvent);

            // Deliver the message to appropriate target(s)
            return await this.deliverMessage(message);
        } catch (error) {
            console.error(`Error sending message for plugin ${pluginId}:`, error);
            return false;
        }
    }

    /**
     * Deliver a message to its target
     * 
     * @param message Message to deliver
     * @returns Promise resolving to true if successful
     */
    private async deliverMessage<T>(message: PluginMessage<T>): Promise<boolean> {
        const { pluginId, target } = message;
        const plugin = pluginRegistry.getPlugin(pluginId);

        if (!plugin) {
            console.error(`Cannot deliver message: Plugin ${pluginId} not found in registry`);
            return false;
        }

        // Handle based on target type
        switch (target) {
            case MessageTarget.BACKGROUND:
                return await this.deliverToBackground(message, plugin);

            case MessageTarget.SUMMARY:
            case MessageTarget.EXPAND:
                return await this.deliverToViewsByType(message, plugin, target);

            case MessageTarget.ALL_VIEWS:
                return await this.deliverToAllViews(message, plugin);

            default:
                // Check if target is a specific view ID
                return await this.deliverToViewById(message, plugin, target);
        }
    }

    /**
     * Deliver message to background script
     */
    private async deliverToBackground<T>(message: PluginMessage<T>, plugin: RegisteredPlugin): Promise<boolean> {
        if (!plugin.activeBackground?.proxy?.handleMessage ||
            typeof plugin.activeBackground.proxy.handleMessage !== 'function') {
            console.warn(`Cannot deliver message to background: Plugin ${message.pluginId} has no active background worker or no handleMessage method`);
            return false;
        }

        try {
            await plugin.activeBackground.proxy.handleMessage(message.topic, message);
            return true;
        } catch (error) {
            console.error(`Error delivering message to background for plugin ${message.pluginId}:`, error);
            return false;
        }
    }

    /**
     * Deliver message to views of a specific type
     */
    private async deliverToViewsByType<T>(message: PluginMessage<T>, plugin: RegisteredPlugin, viewType: string): Promise<boolean> {
        const views = plugin.activeViews.filter(view => view.type === viewType);

        if (views.length === 0) {
            console.warn(`Cannot deliver message to ${viewType} views: Plugin ${message.pluginId} has no active ${viewType} views`);
            return false;
        }

        let success = true;

        for (const view of views) {
            try {
                if (view.iframe?.contentWindow) {
                    view.iframe.contentWindow.postMessage({
                        pluginMessage: message
                    }, '*');
                } else {
                    console.warn(`View ${view.id} has no contentWindow`);
                    success = false;
                }
            } catch (error) {
                console.error(`Error delivering message to view ${view.id} for plugin ${message.pluginId}:`, error);
                success = false;
            }
        }

        return success;
    }

    /**
     * Deliver message to all views
     */
    private async deliverToAllViews<T>(message: PluginMessage<T>, plugin: RegisteredPlugin): Promise<boolean> {
        if (plugin.activeViews.length === 0) {
            console.warn(`Cannot deliver message to views: Plugin ${message.pluginId} has no active views`);
            return false;
        }

        let success = true;

        for (const view of plugin.activeViews) {
            try {
                if (view.iframe?.contentWindow) {
                    view.iframe.contentWindow.postMessage({
                        pluginMessage: message
                    }, '*');
                } else {
                    console.warn(`View ${view.id} has no contentWindow`);
                    success = false;
                }
            } catch (error) {
                console.error(`Error delivering message to view ${view.id} for plugin ${message.pluginId}:`, error);
                success = false;
            }
        }

        return success;
    }

    /**
     * Deliver message to a specific view by ID
     */
    private async deliverToViewById<T>(message: PluginMessage<T>, plugin: RegisteredPlugin, viewId: string): Promise<boolean> {
        const view = plugin.activeViews.find(v => v.id === viewId);

        if (!view) {
            console.warn(`Cannot deliver message to view ${viewId}: View not found for plugin ${message.pluginId}`);
            return false;
        }

        try {
            if (view.iframe?.contentWindow) {
                view.iframe.contentWindow.postMessage({
                    pluginMessage: message
                }, '*');
                return true;
            } else {
                console.warn(`View ${viewId} has no contentWindow`);
                return false;
            }
        } catch (error) {
            console.error(`Error delivering message to view ${viewId} for plugin ${message.pluginId}:`, error);
            return false;
        }
    }

    /**
     * Handle window message event (for communication from views)
     */
    private handleWindowMessage<T>(event: MessageEvent): void {
        // Check if the message is from a plugin view
        if (event.data && event.data.pluginMessage) {
            const message = event.data.pluginMessage as PluginMessage<T>;

            // Validate message has required fields
            if (!message.pluginId || !message.source || !message.target || !message.topic) {
                console.warn('Invalid plugin message received:', message);
                return;
            }

            // Process the message
            this.deliverMessage(message).catch(error => {
                console.error('Error processing message from view:', error);
            });
        }
    }

    /**
     * Generate a unique message ID
     */
    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export default PluginMessageBus.getInstance();