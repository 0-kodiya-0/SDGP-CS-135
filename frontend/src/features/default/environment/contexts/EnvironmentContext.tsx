import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnvironmentStore } from '../store';
import { Environment, EnvironmentPrivacy } from '../types/types.data';
import { useAccount } from '../../user_account';
import * as EnvironmentService from '../services/environment.service';

interface EnvironmentContextType {
    currentEnvironment: Environment | null;
    environments: Environment[];
    isLoading: boolean;
    error: string | null;
    setCurrentEnvironment: (environment: Environment) => Promise<void>;
    createEnvironment: (name: string, privacy?: EnvironmentPrivacy) => Promise<Environment | null>;
    updateEnvironment: (id: string, updates: Partial<Environment>) => Promise<void>;
    deleteEnvironment: (id: string) => Promise<void>;
    refreshEnvironments: () => Promise<void>;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const { currentAccount } = useAccount();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Store-managed state
    const [accountId, setAccountId] = useState<string | undefined>(currentAccount?.id);

    useEffect(() => {
        setAccountId(currentAccount?.id);
    }, [currentAccount]);

    // Get environment store methods
    const storeEnvironments = useEnvironmentStore(state => state.environments);
    const storeSetEnvironment = useEnvironmentStore(state => state.setEnvironment);
    const storeAddEnvironment = useEnvironmentStore(state => state.addEnvironment);
    const storeUpdateEnvironment = useEnvironmentStore(state => state.updateEnvironment);
    const storeDeleteEnvironment = useEnvironmentStore(state => state.deleteEnvironment);
    const storeSyncEnvironments = useEnvironmentStore(state => state.syncEnvironments);
    const storeSelectedIds = useEnvironmentStore(state => state.selectedEnvironmentIds);

    // Keep local state synchronized with store
    const [currentEnvironment, setCurrentEnvironmentState] = useState<Environment | null>(null);
    const [environments, setEnvironmentsState] = useState<Environment[]>([]);

    // Sync environments with server and update local store
    const syncEnvironmentsWithServer = useCallback(async () => {
        if (!accountId) {
            setEnvironmentsState([]);
            setCurrentEnvironmentState(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Fetch environments from server
            const serverEnvironments = await EnvironmentService.fetchEnvironments(accountId);
            
            // Get active environment from server
            const activeEnvironment = await EnvironmentService.getActiveEnvironment(accountId);
            
            // Sync store with server data
            storeSyncEnvironments(accountId, serverEnvironments);
            
            // Update local state
            setEnvironmentsState(serverEnvironments);
            
            // Set current environment based on server active environment
            if (activeEnvironment) {
                setCurrentEnvironmentState(activeEnvironment);
                storeSetEnvironment(activeEnvironment, accountId);
            } else if (serverEnvironments.length > 0) {
                // No active environment set, but environments exist
                // Redirect to environment selection page
                navigate(`/app/${accountId}/environments`);
            } else {
                // No environments exist at all
                navigate(`/app/${accountId}/environments/create`);
            }
        } catch (err) {
            console.error('[EnvironmentContext] Error syncing environments:', err);
            setError('Failed to load environments from server');
        } finally {
            setIsLoading(false);
        }
    }, [accountId, navigate, storeSetEnvironment, storeSyncEnvironments]);

    // Initialize environment when account changes
    useEffect(() => {
        syncEnvironmentsWithServer();
    }, [syncEnvironmentsWithServer]);

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

    // Set current environment - updates both server and local store
    const setCurrentEnvironment = useCallback(async (environment: Environment) => {
        if (!accountId) return;
        
        try {
            // Update the active environment on the server
            await EnvironmentService.setActiveEnvironment(accountId, environment.id);
            
            // Update the local store
            storeSetEnvironment(environment, accountId);
            
            // No need to set local state as it will be updated via the useEffect
        } catch (err) {
            console.error('[EnvironmentContext] Error setting active environment:', err);
            setError('Failed to set active environment');
            throw err;
        }
    }, [accountId, storeSetEnvironment]);

    // Create a new environment - sends to server and updates local store
    const createEnvironment = useCallback(async (
        name: string,
        privacy: EnvironmentPrivacy = EnvironmentPrivacy.Private
    ): Promise<Environment | null> => {
        if (!accountId) return null;

        try {
            setIsLoading(true);
            setError(null);

            // Create environment on the server
            const newEnvironment = await EnvironmentService.createEnvironment(accountId, {
                name: name.trim(),
                privacy
            });

            // Update local store
            storeAddEnvironment(newEnvironment);
            
            return newEnvironment;
        } catch (err) {
            console.error('[EnvironmentContext] Error creating environment:', err);
            setError('Failed to create environment');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [accountId, storeAddEnvironment]);

    // Update an environment - updates both server and local store
    const updateEnvironment = useCallback(async (id: string, updates: Partial<Environment>) => {
        if (!accountId) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            // Update environment on the server
            await EnvironmentService.updateEnvironment(accountId, id, updates);
            
            // Update local store
            storeUpdateEnvironment(id, updates);
        } catch (err) {
            console.error('[EnvironmentContext] Error updating environment:', err);
            setError('Failed to update environment');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [accountId, storeUpdateEnvironment]);

    // Delete an environment - removes from both server and local store
    const deleteEnvironment = useCallback(async (id: string) => {
        if (!accountId) return;
        
        try {
            setIsLoading(true);
            setError(null);
            
            // Delete environment on the server
            await EnvironmentService.deleteEnvironment(accountId, id);
            
            // Remove from local store
            storeDeleteEnvironment(id);
            
            // If the deleted environment was the current one, refresh environments
            if (currentEnvironment?.id === id) {
                await syncEnvironmentsWithServer();
            }
        } catch (err) {
            console.error('[EnvironmentContext] Error deleting environment:', err);
            setError('Failed to delete environment');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [accountId, currentEnvironment, storeDeleteEnvironment, syncEnvironmentsWithServer]);

    // Manually refresh environments from server
    const refreshEnvironments = useCallback(async () => {
        await syncEnvironmentsWithServer();
    }, [syncEnvironmentsWithServer]);

    const value = {
        currentEnvironment,
        environments,
        isLoading,
        error,
        setCurrentEnvironment,
        createEnvironment,
        updateEnvironment,
        deleteEnvironment,
        refreshEnvironments
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