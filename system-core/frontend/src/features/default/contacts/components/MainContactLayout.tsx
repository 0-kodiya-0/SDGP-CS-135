import React from 'react';
import SummaryView from './SummaryView';
import TabView from './TabView';
import { TabProvider } from '../../../required/tab_view';

interface ContactsLayoutProps {
  accountId: string;
}

const ContactsLayout: React.FC<ContactsLayoutProps> = ({ accountId }) => {
  return (
    <TabProvider>
      <div className="flex h-screen bg-gray-100">
        {/* Left sidebar with contact list - takes 1/3 of the width */}
        <div className="w-1/3 border-r border-gray-200">
          <SummaryView accountId={accountId} />
        </div>
        
        {/* Right area for expanded contact details - takes 2/3 of the width */}
        <div className="w-2/3">
          <TabView />
        </div>
      </div>
    </TabProvider>
  );
};

export default ContactsLayout;