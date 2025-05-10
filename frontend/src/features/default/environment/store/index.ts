import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Environment } from '../types/types.data';
import { EnvironmentStore } from '../types/types.store';
import { stateLogger } from '../../../../../lib/logger';

// Create dedicated logger for environment store
const envStoreLogger = stateLogger.extend('environment');

// Helper to generate unique IDs for new environments
// We'll use a combination of timestamp, random values and a counter
let counter = 1;

/**
 * Generates a unique ID for environments using crypto random values
 * combined with a timestamp and an incrementing counter
 * @returns A unique string ID
 */
const generateUniqueId = (): string => {
  // Get current timestamp
  const timestamp = Date.now();

  // Generate random values
  const randomBuffer = new Uint8Array(8);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBuffer);
  } else {
    // Fallback for non-browser environments
    for (let i = 0; i < 8; i++) {
      randomBuffer[i] = Math.floor(Math.random() * 256);
    }
  }

  // Convert to hex string
  const randomHex = Array.from(randomBuffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Combine with counter and timestamp
  const id = `${timestamp.toString(36)}-${randomHex}-${(counter++).toString(36)}`;

  return id;
};

export const useEnvironmentStore = create<EnvironmentStore>()(
  persist(
    (set, get) => ({
      environments: [],
      // Map of accountId to selected environment ID
      selectedEnvironmentIds: {},

      // Set selected environment for an account
      setEnvironment: (environment: Environment, accountId: string): void => {
        envStoreLogger('Setting environment %s (%s) for account %s',
          environment.id, environment.name, accountId);

        set(state => ({
          selectedEnvironmentIds: {
            ...state.selectedEnvironmentIds,
            [accountId]: environment.id
          }
        }));

        envStoreLogger('Environment %s set as active for account %s', environment.id, accountId);
      },

      // Get the selected environment for an account
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
          envStoreLogger('Found environment %s (%s) for account %s',
            environment.id, environment.name, accountId);
        } else {
          envStoreLogger('Selected environment %s not found for account %s', selectedEnvId, accountId);
        }

        return environment;
      },

      // Add a new environment to the store
      addEnvironment: (environmentData): Environment => {
        envStoreLogger('Adding environment for account %s: %s',
          environmentData.accountId, environmentData.name);

        // Use the server-provided ID if available
        const newEnvironment: Environment = {
          ...environmentData,
          // If the environment already has an ID (e.g., from server), use it
          id: environmentData.id || generateUniqueId(),
          // Use provided created/lastModified or generate new ones
          created: environmentData.created || new Date().toISOString(),
          lastModified: environmentData.lastModified || new Date().toISOString()
        };

        set(state => {
          // Check if this is the first environment for this account
          const isFirstForAccount = !state.environments.some(
            env => env.accountId === environmentData.accountId
          );

          const updatedSelectedIds = { ...state.selectedEnvironmentIds };

          // Only auto-select the new environment if:
          // 1. It's the first environment for this account, OR
          // 2. There's no currently selected environment for this account
          if (isFirstForAccount || updatedSelectedIds[environmentData.accountId] === undefined) {
            envStoreLogger('Setting new environment as selected for account %s', environmentData.accountId);
            updatedSelectedIds[environmentData.accountId] = newEnvironment.id;
          }

          return {
            environments: [...state.environments, newEnvironment],
            selectedEnvironmentIds: updatedSelectedIds
          };
        });

        envStoreLogger('Environment created with ID %s (%s)', newEnvironment.id, newEnvironment.name);
        return newEnvironment;
      },

      // Update an existing environment
      updateEnvironment: (id: string, data: Partial<Environment>): void => {
        envStoreLogger('Updating environment %s with data: %o', id, data);

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
            envStoreLogger('Environment %s updated successfully: %s', id, updated.name);
          } else {
            envStoreLogger('Environment %s not found for update', id);
          }

          return {
            environments: updatedEnvironments
          };
        });
      },

      // Delete an environment
      deleteEnvironment: (id: string): void => {
        envStoreLogger('Deleting environment %s', id);

        set(state => {
          // Find the environment to get its accountId
          const environment = state.environments.find(env => env.id === id);
          if (!environment) {
            envStoreLogger('Environment %s not found for deletion', id);
            return state; // No changes if environment not found
          }

          const accountId = environment.accountId;
          const updatedEnvironments = state.environments.filter(env => env.id !== id);
          
          // Check if the deleted environment was selected
          const updatedSelectedIds = { ...state.selectedEnvironmentIds };
          if (updatedSelectedIds[accountId] === id) {
            // Clear the selection if it was the selected environment
            delete updatedSelectedIds[accountId];
            envStoreLogger('Cleared selected environment for account %s', accountId);
          }

          return {
            environments: updatedEnvironments,
            selectedEnvironmentIds: updatedSelectedIds
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
      },

      // NEW: Sync environments from server
      syncEnvironments: (accountId: string, serverEnvironments: Environment[]): void => {
        envStoreLogger('Syncing environments for account %s from server', accountId);
        
        set(state => {
          // Get all other account environments (keep environments for other accounts)
          const otherEnvironments = state.environments.filter(env => env.accountId !== accountId);
          
          // Combine other account environments with the server environments for this account
          const combinedEnvironments = [...otherEnvironments, ...serverEnvironments];
          
          // Update selected environment ID if needed
          const updatedSelectedIds = { ...state.selectedEnvironmentIds };
          
          // If the previously selected environment no longer exists, clear it
          if (updatedSelectedIds[accountId]) {
            const selectedExists = serverEnvironments.some(
              env => env.id === updatedSelectedIds[accountId]
            );
            
            if (!selectedExists) {
              delete updatedSelectedIds[accountId];
              envStoreLogger('Cleared invalid selected environment for account %s', accountId);
            }
          }
          
          envStoreLogger('Synced %d environments for account %s', serverEnvironments.length, accountId);
          return {
            environments: combinedEnvironments,
            selectedEnvironmentIds: updatedSelectedIds
          };
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

            // Fix any stale references after rehydration
            const { environments, selectedEnvironmentIds } = state;

            // Check if any selected environments no longer exist
            let hasInvalidSelections = false;
            const validSelections = { ...selectedEnvironmentIds };

            Object.entries(selectedEnvironmentIds).forEach(([accountId, envId]) => {
              const envExists = environments.some(env =>
                env.id === envId && env.accountId === accountId
              );

              if (!envExists) {
                delete validSelections[accountId];
                hasInvalidSelections = true;
                envStoreLogger('Removed invalid environment selection for account %s', accountId);
              }
            });

            // Update the store if we fixed any invalid selections
            if (hasInvalidSelections) {
              state.selectedEnvironmentIds = validSelections;
            }

            // With the new string ID system, we don't need to track the max ID
            // But we'll ensure our counter starts above any numeric IDs found
            // in case we're migrating from the old system
            try {
              const numericIds = environments
                .map(env => {
                  // Try to extract numeric part if old format ID exists
                  const numericId = parseInt(env.id.toString(), 10);
                  return isNaN(numericId) ? 0 : numericId;
                });

              const maxNumericId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
              counter = maxNumericId + 1;
              envStoreLogger('Set counter to %d for ID generation', counter);
            } catch {
              envStoreLogger('Error calculating max ID, using default counter');
            }
          } else {
            envStoreLogger('Failed to rehydrate environment store');
          }
        };
      }
    }
  )
);