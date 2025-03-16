import eventBus from "../../events";
import pluginRegistry from "./pluginRegistry";
import { PluginId, RegisteredPlugin } from "./types";
import { PluginMessageEvent } from "./types.event";
import { PluginMessage, MessageTarget } from "./types.message";
import { pluginMessageLogger } from "./utils/logger";

/**
 * Plugin Message Bus - Simple messaging system for plugin components
 * 
 * Enables communication between components within a single plugin
 * (background script and views)
 */
export class PluginMessageBus {
    private static instance: PluginMessageBus;

    private constructor() {
        pluginMessageLogger('Plugin message bus initialized');
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
                pluginMessageLogger('Cannot send message: Plugin %s is not registered', pluginId);
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

            pluginMessageLogger('Sending message: plugin=%s, topic=%s, source=%s, target=%s',
                pluginId, topic, source, target);

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
            pluginMessageLogger('Error sending message for plugin %s: %o', pluginId, error);
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
            pluginMessageLogger('Cannot deliver message: Plugin %s not found in registry', pluginId);
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
            pluginMessageLogger('Cannot deliver message to background: Plugin %s has no active background worker', message.pluginId);
            return false;
        }

        try {
            pluginMessageLogger('Delivering message to background: plugin=%s, topic=%s',
                message.pluginId, message.topic);
            await plugin.activeBackground.proxy.handleMessage(message.topic, message);
            return true;
        } catch (error) {
            pluginMessageLogger('Error delivering message to background for plugin %s: %o', message.pluginId, error);
            return false;
        }
    }

    /**
     * Deliver message to views of a specific type
     */
    private async deliverToViewsByType<T>(message: PluginMessage<T>, plugin: RegisteredPlugin, viewType: string): Promise<boolean> {
        const views = plugin.activeViews.filter(view => view.type === viewType);

        if (views.length === 0) {
            pluginMessageLogger('Cannot deliver message to %s views: Plugin %s has no active %s views',
                viewType, message.pluginId, viewType);
            return false;
        }

        pluginMessageLogger('Delivering message to %d %s views: plugin=%s, topic=%s',
            views.length, viewType, message.pluginId, message.topic);

        let success = true;

        for (const view of views) {
            if (!view?.proxy?.handleMessage || typeof view.proxy.handleMessage !== 'function') {
                pluginMessageLogger('View %s has no handleMessage method', view.id);
                success = false;
                continue;
            }

            try {
                await view.proxy.handleMessage(message.topic, message);
            } catch (error) {
                pluginMessageLogger('Error delivering message to view %s for plugin %s: %o',
                    view.id, message.pluginId, error);
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
            pluginMessageLogger('Cannot deliver message to views: Plugin %s has no active views', message.pluginId);
            return false;
        }

        pluginMessageLogger('Delivering message to all %d views: plugin=%s, topic=%s',
            plugin.activeViews.length, message.pluginId, message.topic);

        let success = true;

        for (const view of plugin.activeViews) {
            if (!view?.proxy?.handleMessage || typeof view.proxy.handleMessage !== 'function') {
                pluginMessageLogger('View %s has no handleMessage method', view.id);
                success = false;
                continue;
            }

            try {
                await view.proxy.handleMessage(message.topic, message);
            } catch (error) {
                pluginMessageLogger('Error delivering message to view %s for plugin %s: %o',
                    view.id, message.pluginId, error);
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
            pluginMessageLogger('Cannot deliver message to view %s: View not found for plugin %s',
                viewId, message.pluginId);
            return false;
        }

        if (!view?.proxy?.handleMessage || typeof view.proxy.handleMessage !== 'function') {
            pluginMessageLogger('View %s has no handleMessage method', viewId);
            return false;
        }

        try {
            pluginMessageLogger('Delivering message to specific view %s: plugin=%s, topic=%s',
                viewId, message.pluginId, message.topic);
            await view.proxy.handleMessage(message.topic, message);
            return true;
        } catch (error) {
            pluginMessageLogger('Error delivering message to view %s for plugin %s: %o',
                viewId, message.pluginId, error);
            return false;
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