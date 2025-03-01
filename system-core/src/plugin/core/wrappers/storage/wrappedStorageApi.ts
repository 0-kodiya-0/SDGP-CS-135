import storageApi from "../../../../storage";
import { StorageOptions, StorageProvider } from "../../../../storage/types";
import { WrappedStorageProvider } from "./wrappedStorageProvider";

/**
 * Wrapper API for storage with permission controls
 */
export class WrappedStorageApi {
    /**
     * Create a wrapped storage provider with permission controls
     * 
     * @param options Storage options for creating the provider
     * @param permissions Configuration for read/write permissions
     * @returns A wrapped storage provider
     */
    createStorage(
        options: StorageOptions,
        permissions: { canRead: boolean; canWrite: boolean }
    ): WrappedStorageProvider {
        const storageProvider = storageApi.getStorage(options);
        return new WrappedStorageProvider(
            storageProvider,
            permissions.canRead,
            permissions.canWrite
        );
    }

    /**
     * Create a read-only storage provider
     * 
     * @param options Storage options for creating the provider
     * @returns A wrapped storage provider with read-only permissions
     */
    createReadOnlyStorage(options: StorageOptions): WrappedStorageProvider {
        return this.createStorage(options, { canRead: true, canWrite: false });
    }

    /**
     * Create a write-only storage provider
     * 
     * @param options Storage options for creating the provider
     * @returns A wrapped storage provider with write-only permissions
     */
    createWriteOnlyStorage(options: StorageOptions): WrappedStorageProvider {
        return this.createStorage(options, { canRead: false, canWrite: true });
    }

    /**
     * Create a full-access storage provider
     * 
     * @param options Storage options for creating the provider
     * @returns A wrapped storage provider with full permissions
     */
    createFullAccessStorage(options: StorageOptions): WrappedStorageProvider {
        return this.createStorage(options, { canRead: true, canWrite: true });
    }

    /**
     * Get the original unwrapped storage provider (for admin or system use)
     * 
     * @param options Storage options for creating the provider
     * @returns The unwrapped storage provider
     */
    getUnwrappedStorage(options: StorageOptions): StorageProvider {
        return storageApi.getStorage(options);
    }
}

// Create a singleton instance of the wrapped storage API
const wrappedStorageApi = new WrappedStorageApi();
export default wrappedStorageApi;