import React from 'react';
import { LucideIcon, FileQuestion } from 'lucide-react';

interface FeaturePlaceholderProps {
  featureName?: string;
  icon?: LucideIcon;
  accountId?: string;
}

const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({ 
  featureName = 'Feature', 
  icon: Icon = FileQuestion,
  accountId 
}) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 p-8">
      <Icon size={48} className="mb-4 text-gray-300" />
      <h2 className="text-xl font-semibold mb-2">Please select a feature</h2>
      <p className="text-center">Choose an option from the menu to get started</p>
    </div>
  );
};

export default FeaturePlaceholder;