import React from 'react';
import { LucideIcon, FileQuestion } from 'lucide-react';
import { Environment } from '../../../default/environment';

interface FeaturePlaceholderProps {
  featureName?: string;
  icon?: LucideIcon;
  environment?: Environment;
  accountId: string;
}

const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({ 
  featureName = 'Feature', 
  icon: Icon = FileQuestion,
  environment,
  accountId 
}) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 p-8">
      <Icon size={48} className="mb-4 text-gray-300" />
      <h2 className="text-xl font-semibold mb-2">{featureName.charAt(0).toUpperCase() + featureName.slice(1)} Feature</h2>
      <p className="text-center mb-4">This feature is not implemented yet.</p>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
        <div className="flex items-start">
          <div>
            <p className="text-sm text-gray-600 mb-2">Implementation details:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
              <li>Create a component at: <code className="bg-gray-100 px-1 rounded">features/{featureName}/{featureName.charAt(0).toUpperCase() + featureName.slice(1)}Component.tsx</code></li>
              <li>Environment: {environment ? environment.name : 'Not available'}</li>
              <li>Account ID: {accountId || 'Not available'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturePlaceholder;