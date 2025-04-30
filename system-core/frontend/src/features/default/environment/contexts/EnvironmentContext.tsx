import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useEnvironmentStore } from '../store';
import { Environment, EnvironmentPrivacy, EnvironmentStatus } from '../types/types.data';
import { useAccount } from '../../user_account';

interface EnvironmentContextType {
    currentEnvironment: Environment | null;
    environments: Environment[];
    isLoading: boolean;
    error: string | null;
    setCurrentEnvironment: (environment: Environment) => void;
    createEnvironment: (name: string, privacy?: EnvironmentPrivacy) => Promise<Environment | null>;
    updateEnvironment: (id: string, updates: Partial<Environment>) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentAccount } = useAccount();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Store-managed state
    const [accountId, setAccountId] = useState<string | undefined>(currentAccount?.id);

    useEffect(() => {
        setAccountId(currentAccount?.id);
        console.log("Current", currentAccount)
    }, [currentAccount]);

    // Get environment store methods
    const getEnvironment = useEnvironmentStore(state => state.getEnvironment);
    const getEnvironmentsByAccount = useEnvironmentStore(state => state.getEnvironmentsByAccount);
    const setEnvironment = useEnvironmentStore(state => state.setEnvironment);
    const addEnvironment = useEnvironmentStore(state => state.addEnvironment);
    const updateEnvironmentStore = useEnvironmentStore(state => state.updateEnvironment);

    // Use store values directly for realtime updates
    const storeEnvironments = useEnvironmentStore(state => state.environments);
    const storeSelectedIds = useEnvironmentStore(state => state.selectedEnvironmentIds);

    // Keep local state synchronized with store
    const [currentEnvironment, setCurrentEnvironmentState] = useState<Environment | null>(null);
    const [environments, setEnvironmentsState] = useState<Environment[]>([]);

    // Sync local state with store whenever relevant store state changes
    useEffect(() => {
        if (!accountId) {
            setEnvironmentsState([]);
            setCurrentEnvironmentState(null);
            return;
        }

        const accountEnvironments = storeEnvironments.filter(env => env.accountId === accountId);
        setEnvironmentsState(accountEnvironments);

        const selectedEnvId = storeSelectedIds[accountId];
        const selectedEnv = selectedEnvId
            ? accountEnvironments.find(env => env.id === selectedEnvId) || null
            : null;

        setCurrentEnvironmentState(selectedEnv);
    }, [accountId, storeEnvironments, storeSelectedIds]);

    // Initialize environment when account changes
    useEffect(() => {
        const initializeEnvironment = async () => {
            if (!accountId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const accountEnvironments = getEnvironmentsByAccount(accountId);

                // If no environments exist for this account, create a default one
                if (accountEnvironments.length === 0) {
                    console.log(`[EnvironmentContext] Creating default environment for account ${accountId}`);

                    const defaultEnvironment = addEnvironment({
                        accountId,
                        name: 'Default Environment',
                        status: EnvironmentStatus.Active,
                        privacy: EnvironmentPrivacy.Private
                    });

                    // Explicitly set the default environment as selected for this account
                    setEnvironment(defaultEnvironment, accountId);
                } else {
                    // If there are existing environments but none selected, select the first one
                    const currentSelected = getEnvironment(accountId);
                    if (!currentSelected) {
                        setEnvironment(accountEnvironments[0], accountId);
                    }
                }

                setError(null);
            } catch (err) {
                console.error('[EnvironmentContext] Error initializing environments:', err);
                setError('Failed to initialize environments');
            } finally {
                setIsLoading(false);
            }
        };

        initializeEnvironment();
    }, [accountId, addEnvironment, getEnvironment, getEnvironmentsByAccount, setEnvironment]);

    const setCurrentEnvironment = useCallback((environment: Environment) => {
        if (!accountId) return;
        setEnvironment(environment, accountId);
        // No need to set local state as it will be updated via the useEffect
    }, [accountId, setEnvironment]);

    const createEnvironment = useCallback(async (
        name: string,
        privacy: EnvironmentPrivacy = EnvironmentPrivacy.Global
    ): Promise<Environment | null> => {
        if (!accountId) return null;

        try {
            setIsLoading(true);

            const newEnvironment = addEnvironment({
                accountId,
                name: name.trim(),
                status: EnvironmentStatus.Active,
                privacy
            });

            // Set environment only after creation is confirmed
            setCurrentEnvironment(newEnvironment);
            return newEnvironment;
        } catch (err) {
            console.error('[EnvironmentContext] Error creating environment:', err);
            setError('Failed to create environment');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [accountId, addEnvironment, setCurrentEnvironment]);

    const updateEnvironment = useCallback((id: string, updates: Partial<Environment>) => {
        try {
            updateEnvironmentStore(id, updates);
        } catch (err) {
            console.error('[EnvironmentContext] Error updating environment:', err);
            setError('Failed to update environment');
        }
    }, [updateEnvironmentStore]);

    const value = {
        currentEnvironment,
        environments,
        isLoading,
        error,
        setCurrentEnvironment,
        createEnvironment,
        updateEnvironment
    };

    return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
};

export const useEnvironment = (): EnvironmentContextType => {
    const context = useContext(EnvironmentContext);
    if (context === undefined) {
        throw new Error('useEnvironment must be used within an EnvironmentProvider');
    }
    return context;
};