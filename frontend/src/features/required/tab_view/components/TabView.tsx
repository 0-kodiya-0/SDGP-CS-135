import React from 'react';
import TabManagement from './TabManagement';
import TabContent from './TabContent';

interface TabViewProps {
  className?: string;
}

export const TabView: React.FC<TabViewProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Bar */}
      <TabManagement className="flex-shrink-0" />

      {/* Tab Content */}
      <TabContent />
    </div>
  );
};

export default TabView;