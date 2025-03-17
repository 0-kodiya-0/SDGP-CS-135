import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount } from '../../../../services/auth';
import { useEnvironmentStore } from '../store';
import { Environment, EnvironmentPrivacy, EnvironmentStatus } from '../types/types.data';

interface EnvironmentContextType {
    currentEnvironment: Environment | null;
    environments: Environment[];
    isLoading: boolean;
    error: string | null;
    setCurrentEnvironment: (environment: Environment) => void;
    createEnvironment: (name: string, privacy?: EnvironmentPrivacy) => Promise<Environment | null>;
    updateEnvironment: (id: number, updates: Partial<Environment>) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentAccount } = useAccount();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Get environment store methods
    const getEnvironment = useEnvironmentStore(state => state.getEnvironment);
    const getEnvironmentsByAccount = useEnvironmentStore(state => state.getEnvironmentsByAccount);
    const setEnvironment = useEnvironmentStore(state => state.setEnvironment);
    const addEnvironment = useEnvironmentStore(state => state.addEnvironment);
    const updateEnvironmentStore = useEnvironmentStore(state => state.updateEnvironment);

    // Get accountId from currentAccount
    const accountId = currentAccount?.accountId || '';

    // Get current environment and all environments for this account
    const currentEnvironment = accountId ? getEnvironment(accountId) : null;
    const environments = accountId ? getEnvironmentsByAccount(accountId) : [];

    // Initialize environment when account changes
    useEffect(() => {
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

                setEnvironment(defaultEnvironment, accountId);
            }

            setError(null);
        } catch (err) {
            console.error('[EnvironmentContext] Error initializing environments:', err);
            setError('Failed to initialize environments');
        } finally {
            setIsLoading(false);
        }
    }, [accountId, addEnvironment, getEnvironmentsByAccount, setEnvironment]);

    const setCurrentEnvironment = (environment: Environment) => {
        if (!accountId) return;
        setEnvironment(environment, accountId);
    };

    const createEnvironment = async (
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

            setCurrentEnvironment(newEnvironment);
            return newEnvironment;
        } catch (err) {
            console.error('[EnvironmentContext] Error creating environment:', err);
            setError('Failed to create environment');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const updateEnvironment = (id: number, updates: Partial<Environment>) => {
        updateEnvironmentStore(id, updates);
    };

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