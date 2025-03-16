import { Environment } from "./types.data";

// Define the environment data without the auto-generated fields
export type EnvironmentCreateData = Omit<Environment, 'id' | 'created' | 'lastModified'>;

export interface EnvironmentStore {
  // State
  environments: Environment[];
  selectedEnvironmentIds: { [accountId: number]: number };
  
  // Actions
  setEnvironment: (environment: Environment, accountId: number) => void;
  getEnvironment: (accountId: number) => Environment | null;
  addEnvironment: (environment: EnvironmentCreateData) => Environment;
  updateEnvironment: (id: number, data: Partial<Environment>) => void;
  
  // New account-specific actions
  getEnvironmentsByAccount: (accountId: number) => Environment[];
  clearSelectedEnvironment: (accountId: number) => void;
}