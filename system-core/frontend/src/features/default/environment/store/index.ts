import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Environment } from '../types/types.data';
import { EnvironmentStore } from '../types/types.store';
import { stateLogger } from '../../../../../lib/logger';

// Create dedicated logger for environment store
const envStoreLogger = stateLogger.extend('environment');

// Helper to generate unique IDs for new environments
let nextId = 1;

export const useEnvironmentStore = create<EnvironmentStore>()(
  persist(
    (set, get) => ({
      environments: [],
      // Map of accountId to selected environment ID
      selectedEnvironmentIds: {},

      setEnvironment: (environment: Environment, accountId: string): void => {
        envStoreLogger('Setting environment %d (%s) for account %s',
          environment.id, environment.name, accountId);

        set(state => ({
          selectedEnvironmentIds: {
            ...state.selectedEnvironmentIds,
            [accountId]: environment.id
          }
        }));

        envStoreLogger('Environment %d set as active for account %s', environment.id, accountId);
      },

      getEnvironment: (accountId: string): Environment | null => {
        envStoreLogger('Getting environment for account %s', accountId);
        const state = get();
        const selectedEnvId = state.selectedEnvironmentIds[accountId];

        if (selectedEnvId === undefined) {
          envStoreLogger('No selected environment found for account %s', accountId);
          return null;
        }

        const environment = state.environments.find(
          env => env.id === selectedEnvId && env.accountId === accountId
        ) || null;

        if (environment) {
          envStoreLogger('Found environment %d (%s) for account %s',
            environment.id, environment.name, accountId);
        } else {
          envStoreLogger('Selected environment %d not found for account %s', selectedEnvId, accountId);
        }

        return environment;
      },

      addEnvironment: (environmentData): Environment => {
        envStoreLogger('Adding new environment for account %s: %s',
          environmentData.accountId, environmentData.name);

        const newEnvironment: Environment = {
          ...environmentData,
          id: nextId++,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };

        set(state => {
          // Check if this is the first environment for this account
          const isFirstForAccount = !state.environments.some(
            env => env.accountId === environmentData.accountId
          );

          if (isFirstForAccount) {
            envStoreLogger('This is the first environment for account %s', environmentData.accountId);
          }

          // Always set new environment as selected for that account
          const updatedSelectedIds = {
            ...state.selectedEnvironmentIds,
            [environmentData.accountId]: newEnvironment.id
          };

          return {
            environments: [...state.environments, newEnvironment],
            selectedEnvironmentIds: updatedSelectedIds
          };
        });

        envStoreLogger('Environment created with ID %d (%s)', newEnvironment.id, newEnvironment.name);
        return newEnvironment;
      },

      updateEnvironment: (id: number, data: Partial<Environment>): void => {
        envStoreLogger('Updating environment %d with data: %o', id, data);

        set(state => {
          const updatedEnvironments = state.environments.map(env =>
            env.id === id ? {
              ...env,
              ...data,
              lastModified: new Date().toISOString()
            } : env
          );

          const updated = updatedEnvironments.find(env => env.id === id);
          if (updated) {
            envStoreLogger('Environment %d updated successfully: %s', id, updated.name);
          } else {
            envStoreLogger('Environment %d not found for update', id);
          }

          return {
            environments: updatedEnvironments
          };
        });
      },

      // Get all environments for a specific account
      getEnvironmentsByAccount: (accountId: string): Environment[] => {
        envStoreLogger('Getting all environments for account %s', accountId);
        const environments = get().environments.filter(env => env.accountId === accountId);
        envStoreLogger('Found %d environments for account %s', environments.length, accountId);
        return environments;
      },

      // Clear selected environment for an account
      clearSelectedEnvironment: (accountId: string): void => {
        envStoreLogger('Clearing selected environment for account %s', accountId);

        set(state => {
          const updatedSelections = { ...state.selectedEnvironmentIds };
          delete updatedSelections[accountId];

          envStoreLogger('Selected environment cleared for account %s', accountId);
          return { selectedEnvironmentIds: updatedSelections };
        });
      }
    }),
    {
      name: 'environment-storage',
      onRehydrateStorage: () => {
        envStoreLogger('Rehydrating environment store from storage');
        return (state) => {
          if (state) {
            envStoreLogger('Environment store rehydrated with %d environments',
              state.environments.length);
          } else {
            envStoreLogger('Failed to rehydrate environment store');
          }
        };
      }
    }
  )
);