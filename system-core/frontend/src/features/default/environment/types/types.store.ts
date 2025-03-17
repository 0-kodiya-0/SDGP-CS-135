import { EnvironmentStatus, EnvironmentPrivacy, Environment } from "./types.data";

export interface EnvironmentCreateData {
    accountId: string;
    name: string;
    status: EnvironmentStatus;
    privacy: EnvironmentPrivacy;
}

export interface EnvironmentStore {
    // Data
    environments: Environment[];
    selectedEnvironmentIds: Record<string, number>;

    // Actions
    setEnvironment: (environment: Environment, accountId: string) => void;
    getEnvironment: (accountId: string) => Environment | null;
    addEnvironment: (data: EnvironmentCreateData) => Environment;
    updateEnvironment: (id: number, data: Partial<Environment>) => void;
    
    // Helpers
    getEnvironmentsByAccount: (accountId: string) => Environment[];
    clearSelectedEnvironment: (accountId: string) => void;
}