import { useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Environment } from '../../../default/environment/types/types.data';
import { Loader2 } from 'lucide-react';

const ContactsFeature = lazy(() => import('../../../default/contacts/components/SummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const DefaultFeature = lazy(() => import('./FeaturePlaceholder.tsx'));

export interface DetailPaneProps {
  environment: Environment;
  accountId: string;
  className?: string;
  refreshTrigger: number;
  onFileChange: () => void;
  onFileSelect: (fileName: string | null) => void;
}

export function DetailPane({ environment, className, accountId }: DetailPaneProps) {
  const location = useLocation();

  // Extract the current feature from the path
  const pathSegments = location.pathname.split('/');
  const currentFeature = pathSegments[pathSegments.length - 1];

  useEffect(() => {
    console.log(`[DetailPane] Loading feature: ${currentFeature}`);
  }, [currentFeature]);

  // Determine which component to render based on the URL path
  const renderFeatureComponent = () => {
    switch (currentFeature) {
      case 'contacts':
        return <ContactsFeature accountId={accountId} />;
      default:
        return;
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>
      <Suspense fallback={
        <div className="h-full w-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      }>
        {renderFeatureComponent()}
      </Suspense>
    </div>
  );
}
