import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './layout/navbar/Navbar';
import { AccountProvider, useAccount } from "./features/default/user_account";
import { TabProvider } from "./features/required/tab_view/context/TabContext";
import { FeatureProvider } from "./features/required/left_navigation/context/FeatureContext";
import { PopupProvider } from "./features/shared/popup/context/PopupContext";
import { SummaryBar } from "./features/required/left_navigation/components/SummaryBar";
import { DetailPane } from "./features/required/left_navigation/components/DetailPane";
import { TabView } from "./features/required/tab_view/components/TabView";

const queryClient = new QueryClient();

const App: React.FC = () => {
  const { currentAccount, accountDetails } = useAccount();

  return (
    <QueryClientProvider client={queryClient}>
      <PopupProvider>
        <FeatureProvider>
          <TabProvider>
            <AccountProvider>
              <div className="h-screen flex flex-col">
                <Navbar />
                <div className="flex-1 flex overflow-hidden">
                  <SummaryBar className="w-16" accountId={accountDetails?.id} />
                  <DetailPane className="w-64" accountId={accountDetails?.id} />
                  <TabView className="flex-1" />
                </div>
              </div>
            </AccountProvider>
          </TabProvider>
        </FeatureProvider>
      </PopupProvider>
    </QueryClientProvider>
  );
};

export default App;