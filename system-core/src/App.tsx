import { QueryClientProvider } from "@tanstack/react-query";
import { Footer, Header, Navbar } from "./layout";
import { queryClient } from './mock/persistConfig';
import { useEnvironmentStore } from "./features/default/environment";
import { useAccountStore } from "./features/default/user_account";
import { PluginProvider } from "./plugin/core";
import { useEffect, useState } from "react";
import { EnvironmentPrivacy, EnvironmentStatus } from "./features/default/environment/types/types.data";

export const App = () => {
    const activeAccount = useAccountStore(state => state.activeAccount);
    const [isInitializing, setIsInitializing] = useState(false);
    
    // Get all store functions directly
    const getEnvironment = useEnvironmentStore(state => state.getEnvironment);
    const getEnvironmentsByAccount = useEnvironmentStore(state => state.getEnvironmentsByAccount);
    const addEnvironment = useEnvironmentStore(state => state.addEnvironment);
    const setEnvironment = useEnvironmentStore(state => state.setEnvironment);
    const environments = useEnvironmentStore(state => state.environments);
    
    // Calculate the environment based on the active account
    const environment = activeAccount ? getEnvironment(activeAccount.id) : null;
    
    // Create a default environment if no environments exist for this account
    useEffect(() => {
        if (!activeAccount || isInitializing) return;
        
        const accountEnvironments = getEnvironmentsByAccount(activeAccount.id);
        
        if (accountEnvironments.length === 0) {
            console.log(`[App] No environments found for account ${activeAccount.id}. Creating default environment.`);
            setIsInitializing(true);
            
            // Create a default environment
            try {
                const defaultEnvironment = addEnvironment({
                    accountId: activeAccount.id,
                    name: 'Default Environment',
                    status: EnvironmentStatus.Active,
                    privacy: EnvironmentPrivacy.Private
                });
                
                // Set it as the selected environment for this account
                setEnvironment(defaultEnvironment, activeAccount.id);
                console.log(`[App] Default environment created: ${defaultEnvironment.id} (${defaultEnvironment.name})`);
            } catch (error) {
                console.error('[App] Error creating default environment:', error);
            } finally {
                setIsInitializing(false);
            }
        }
    }, [activeAccount, getEnvironmentsByAccount, addEnvironment, setEnvironment, isInitializing]);
    
    // Debug logging to trace re-renders and environment state
    useEffect(() => {
        console.log("[App] Environment state updated:", 
            environments.length > 0 ? `${environments.length} environments` : "No environments",
            "Current environment:", environment?.name || "None");
    }, [environments, environment]);

    if (!activeAccount) {
        return <div className="w-full h-full flex justify-center items-center">
            No Active account. Please login first
        </div>
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            <QueryClientProvider client={queryClient}>
                <Navbar activeAccount={activeAccount} />
                <PluginProvider environment={environment}>
                    <Header 
                        key={`env-${environment?.id || 'none'}`} 
                        environment={environment} 
                        isLoading={isInitializing}
                    />
                </PluginProvider>
                <Footer />
            </QueryClientProvider>
        </div>
    );
};

export default App;