import { Environment } from "./data.ts";

export interface EnvironmentStore {
    selectedEnvironment: Environment | null;
    setEnvironment: (environment: Environment) => void;
    getEnvironment: () => Environment | null;
}