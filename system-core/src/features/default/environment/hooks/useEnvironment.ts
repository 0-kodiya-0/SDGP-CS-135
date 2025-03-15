import { useCallback, useMemo } from 'react';
import { useEnvironmentStore } from '../store';
import { Environment, EnvironmentPrivacy, EnvironmentStatus } from '../types/types.data';
import { EnvironmentCreateData } from '../types/types.store';

interface UseEnvironmentReturn {
    // Current environment state
    currentEnvironment: Environment | null;
    environments: Environment[];

    // Actions
    setCurrentEnvironment: (environment: Environment) => void;
    createEnvironment: (data: Omit<EnvironmentCreateData, 'accountId'>) => Environment;
    updateEnvironment: (id: number, updates: Partial<Environment>) => void;

    // Helpers
    isEnvironmentActive: (environmentId: number) => boolean;
}

/**
 * Hook for managing environments
 * Provides access to the current environment and methods to create/update environments
 * @param accountId The ID of the active account
 */
export const useEnvironment = (accountId: number): UseEnvironmentReturn => {
    const {
        getEnvironment,
        getEnvironmentsByAccount,
        setEnvironment,
        addEnvironment,
        updateEnvironment
    } = useEnvironmentStore();

    // Get current environment for this account
    const currentEnvironment = getEnvironment(accountId);
    
    // Get all environments for this account
    const accountEnvironments = getEnvironmentsByAccount(accountId);

    // Memoize active environments for this account
    const activeEnvironments = useMemo(() =>
        accountEnvironments.filter(env => env.status === EnvironmentStatus.Active),
        [accountEnvironments]);

    // Set current environment for this account
    const setCurrentEnvironment = useCallback((environment: Environment) => {
        setEnvironment(environment, accountId);
    }, [setEnvironment, accountId]);

    // Create a new environment for this account
    const createEnvironment = useCallback((
        data: Omit<EnvironmentCreateData, 'accountId'>
    ): Environment => {
        // Set defaults if not provided
        const newEnvData: EnvironmentCreateData = {
            ...data,
            accountId,
            status: data.status || EnvironmentStatus.Active,
            privacy: data.privacy || EnvironmentPrivacy.Global
        };

        return addEnvironment(newEnvData);
    }, [addEnvironment, accountId]);

    // Helper to check if environment is active
    const isEnvironmentActive = useCallback((environmentId: number): boolean => {
        const env = accountEnvironments.find(e => e.id === environmentId);
        return env?.status === EnvironmentStatus.Active;
    }, [accountEnvironments]);

    return {
        currentEnvironment,
        environments: activeEnvironments,
        setCurrentEnvironment,
        createEnvironment,
        updateEnvironment,
        isEnvironmentActive
    };
};

export default useEnvironment;