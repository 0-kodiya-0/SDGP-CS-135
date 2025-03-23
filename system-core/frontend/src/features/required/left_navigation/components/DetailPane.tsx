import { useEffect, lazy, Suspense } from 'react';
import { Environment } from '../../../default/environment/types/types.data';
import { Loader2 } from 'lucide-react';
import { useFeature } from '../context/FeatureContext';

const ContactsFeature = lazy(() => import('../../../default/contacts/components/SummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const FilesFeature = lazy(() => import('../../../default/files/components/SummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const CalendarFeature = lazy(() => import('../../../default/calender/components/SummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const MailFeature = lazy(() => import('../../../default/mail/components/SummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const WorkspaceFeature = lazy(() => import('../../../required/workspace/components/SummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const DefaultFeature = lazy(() => import('./FeaturePlaceholder.tsx'));

export interface DetailPaneProps {
  environment: Environment;
  accountId: string;
  className?: string;
}

export function DetailPane({ environment, className, accountId }: DetailPaneProps) {
  const { currentFeature } = useFeature();

  useEffect(() => {
    console.log(`[DetailPane] Loading feature: ${currentFeature}`);
  }, [currentFeature]);

  // Determine which component to render based on the selected feature
  const renderFeatureComponent = () => {
    switch (currentFeature) {
      case 'contacts':
        return <ContactsFeature accountId={accountId} />;
      case 'files':
        return <FilesFeature accountId={accountId} />;
      case 'calendar':
        return <CalendarFeature accountId={accountId} />;
      case 'mail':
        return <MailFeature accountId={accountId} />;
      case 'workspace':
        return <WorkspaceFeature accountId={accountId} />
      default:
        return <DefaultFeature accountId={accountId} />;
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