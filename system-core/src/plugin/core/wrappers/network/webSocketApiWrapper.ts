import { networkApi, ProviderType } from "../../../../api/network";
import { NetworkPermission } from "../../types";
import { PluginPermissionError } from "../../types.error";

export class WebSocketApiWrapper {
    private permissions: NetworkPermission;
    
    constructor(permissions: NetworkPermission) {
        this.permissions = permissions;
    }
    
    /**
     * Validate WebSocket permission
     * @throws PermissionError if WebSocket permission is not granted
     */
    private validatePermission(): void {
        if (!this.permissions.websocket) {
            throw new PluginPermissionError('WebSocket connections');
        }
    }
    
    /**
     * Create a WebSocket connection
     * @param namespace Instance identifier
     * @param url WebSocket URL
     */
    createConnection(namespace: string) {
        this.validatePermission();
        return networkApi.createWebSocket({
            type: ProviderType.WEBSOCKET,
            namespace: namespace
        });
    }
}