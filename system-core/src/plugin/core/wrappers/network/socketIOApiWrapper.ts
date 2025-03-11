import { ManagerOptions, SocketOptions } from "socket.io-client";
import { NetworkPermission } from "../../types";
import { networkApi, ProviderType } from "../../../../api/network";
import { PluginPermissionError } from "../../types.error";

/**
 * Socket.IO API wrapper for plugins
 */
export class SocketIOApiWrapper {
    private permissions: NetworkPermission;

    constructor(permissions: NetworkPermission) {
        this.permissions = permissions;
    }

    /**
     * Validate Socket.IO permission
     * @throws PermissionError if WebSocket permission is not granted
     * (Socket.IO relies on WebSocket permission)
     */
    private validatePermission(): void {
        if (!this.permissions.websocket) {
            throw new PluginPermissionError('Socket.IO connections (requires WebSocket permission)');
        }
    }

    /**
     * Create a Socket.IO connection
     * @param namespace Instance identifier
     * @param url Socket.IO URL
     * @param options Additional Socket.IO options
     */
    createConnection(namespace: string, options: Partial<ManagerOptions & SocketOptions> = {}) {
        this.validatePermission();
        return networkApi.createSocketIO({
            type: ProviderType.SOCKETIO,
            namespace: namespace
        }, options);
    }
}