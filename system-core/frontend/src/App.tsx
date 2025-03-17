import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Footer, Header, Navbar } from "./layout";
import { queryClient } from './mock/persistConfig';
import { useAccount } from "./services/auth";
import { useEnvironment } from "./features/default/environment/contexts/EnvironmentContext";

const App: React.FC = () => {
    const { accountDetails } = useAccount();
    const { currentEnvironment, isLoading } = useEnvironment();

    if (!accountDetails) {
        return (
            <div className="w-full h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
                    isLoading={isLoading}
                />
                <Footer />
            </QueryClientProvider>
        </div>
    );
};

export default App;