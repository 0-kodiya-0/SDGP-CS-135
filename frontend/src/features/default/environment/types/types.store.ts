import { EnvironmentStatus, EnvironmentPrivacy, Environment } from "./types.data";

export interface EnvironmentCreateData {
    accountId: string;
    name: string;
    status: EnvironmentStatus;
    privacy: EnvironmentPrivacy;
    // Optional fields that might be provided by the server
    id?: string;
    created?: string;
    lastModified?: string;
}

export interface EnvironmentStore {
    // Data
    environments: Environment[];
    selectedEnvironmentIds: Record<string, string>;

    // Actions
    setEnvironment: (environment: Environment, accountId: string) => void;
    getEnvironment: (accountId: string) => Environment | null;
    addEnvironment: (data: EnvironmentCreateData) => Environment;
    updateEnvironment: (id: string, data: Partial<Environment>) => void;
    deleteEnvironment: (id: string) => void;
    
    // Helpers
    getEnvironmentsByAccount: (accountId: string) => Environment[];
    clearSelectedEnvironment: (accountId: string) => void;
    
    // Server synchronization
    syncEnvironments: (accountId: string, serverEnvironments: Environment[]) => void;
}