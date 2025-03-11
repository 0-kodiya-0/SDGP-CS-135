import { AxiosRequestConfig } from "axios";
import { networkApi, ProviderType } from "../../../../api/network";
import { NetworkPermission } from "../../types";
import { PluginPermissionError } from "../../types.error";

export class HttpApiWrapper {
    private permissions: NetworkPermission;

    constructor(permissions: NetworkPermission) {
        this.permissions = permissions;
    }

    /**
     * Validate HTTP permission
     * @throws PermissionError if HTTP permission is not granted
     */
    private validatePermission(): void {
        if (!this.permissions.http) {
            throw new PluginPermissionError('HTTP requests');
        }
    }
    
    /**
     * Create an Axios instance
     * @param namespace Instance identifier
     * @param config Axios configuration
     */
    createInstance(namespace: string, config: AxiosRequestConfig = {}) {
        this.validatePermission();
        return networkApi.createAxiosInstance({
            type: ProviderType.HTTP,
            namespace: namespace
        }, config);
    }
}