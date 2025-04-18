import React, { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Footer, Header, Navbar } from "./layout";
import { queryClient } from './conf/react_query/persistConfig';
import { useEnvironment } from "./features/default/environment/contexts/EnvironmentContext";
import { useAccount as useAccountDetails } from "./features/default/user_account";
import { registerAllComponents } from "./features/required/tab_view";

const App: React.FC = () => {
    const { isLoading, error, fetchCurrentAccountDetails } = useAccountDetails();
    const { currentEnvironment, isLoading: envLoading } = useEnvironment();

    // Initialize component registry on app startup
    useEffect(() => {
        // Register all components for dynamic loading
        registerAllComponents();
        console.log('Component registry initialized for dynamic tab loading');
    }, []);

    if (isLoading) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-screen flex flex-col justify-center items-center">
                <div className="text-red-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h1 className="text-xl font-semibold mb-2">Failed to load account</h1>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => fetchCurrentAccountDetails()}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            <QueryClientProvider client={queryClient}>
                    <Navbar />
                    <Header
                            key={`env-${currentEnvironment?.id || 'none'}`}
                            environment={currentEnvironment}
                            isLoading={envLoading}
                        />
                    <Footer />
            </QueryClientProvider>
        </div>
    );
};

export default App;