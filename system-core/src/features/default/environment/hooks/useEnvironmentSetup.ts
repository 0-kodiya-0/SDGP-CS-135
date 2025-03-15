import { useEffect, useState, useCallback } from 'react';
import { Environment, EnvironmentPrivacy, EnvironmentStatus } from '../types/types.data';
import { useEnvironment } from './useEnvironment';
import { ActiveAccount } from '../../user_account';
import { useEnvironmentStore } from '../store';

interface EnvironmentSetupState {
    loading: boolean;
    error: Error | null;
    initialized: boolean;
}

interface UseEnvironmentSetupReturn {
    // State
    currentEnvironment: Environment | null;
    environments: Environment[];
    setupState: EnvironmentSetupState;

    // Actions
    selectEnvironment: (environment: Environment) => void;
    createDefaultEnvironment: (account: ActiveAccount) => Environment;
}

/**
 * Hook to handle environment setup logic for a specific account
 * Manages initialization of environments, selecting default environment,
 * and creating a default environment if none exists
 */
export const useEnvironmentSetup = (account: ActiveAccount): UseEnvironmentSetupReturn => {
    const accountId = account.id;

    // Get environment methods from base hook
    const {
        currentEnvironment,
        environments,
        setCurrentEnvironment,
        createEnvironment
    } = useEnvironment(accountId);

    const { getEnvironmentsByAccount } = useEnvironmentStore();

    // Setup state
    const [setupState, setSetupState] = useState<EnvironmentSetupState>({
        loading: true,
        error: null,
        initialized: false
    });

    // Select an environment
    const selectEnvironment = useCallback((environment: Environment) => {
        setCurrentEnvironment(environment);
    }, [setCurrentEnvironment]);

    // Create a default environment for an account
    const createDefaultEnvironment = useCallback((): Environment => {
        // Create a default environment for the account
        const newEnvironment = createEnvironment({
            name: 'Default Environment',
            status: EnvironmentStatus.Active,
            privacy: EnvironmentPrivacy.Private
        });

        // Select it automatically
        selectEnvironment(newEnvironment);

        return newEnvironment;
    }, [createEnvironment, selectEnvironment]);

    // Initialize environment when the hook is first used
    useEffect(() => {
        const initializeEnvironment = () => {
            try {
                setSetupState(prev => ({ ...prev, loading: true }));

                // Get account-specific environments
                const accountEnvironments = getEnvironmentsByAccount(accountId);

                // If we have a selected environment, we're already initialized
                if (currentEnvironment) {
                    setSetupState({
                        loading: false,
                        error: null,
                        initialized: true
                    });
                    return;
                }

                // If there are environments available for this account, select the first one
                if (accountEnvironments.length > 0) {
                    selectEnvironment(accountEnvironments[0]);
                }

                setSetupState({
                    loading: false,
                    error: null,
                    initialized: accountEnvironments.length > 0
                });
            } catch (error) {
                setSetupState({
                    loading: false,
                    error: error instanceof Error ? error : new Error('Failed to initialize environment'),
                    initialized: false
                });
            }
        };

        initializeEnvironment();
    }, [accountId, currentEnvironment, selectEnvironment, getEnvironmentsByAccount]);

    return {
        currentEnvironment,
        environments,
        setupState,
        selectEnvironment,
        createDefaultEnvironment
    };
};

export default useEnvironmentSetup;