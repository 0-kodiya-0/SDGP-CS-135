// components/common/Tab.tsx
import React from 'react';

interface TabProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const Tab: React.FC<TabProps> = ({ isActive, onClick, children }) => {
  return (
    <button
      className={`
        py-3 px-1 font-medium text-sm border-b-2 whitespace-nowrap
        ${isActive 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
};