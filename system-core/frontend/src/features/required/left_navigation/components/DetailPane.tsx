import { useEffect, lazy, Suspense } from 'react';
import { Environment } from '../../../default/environment/types/types.data';
import { Loader2 } from 'lucide-react';
import { useFeatureStore } from '../store/useFeatureStore';

const ContactsFeature = lazy(() => import('../../../default/contacts/components/ContactSummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const FilesFeature = lazy(() => import('../../../default/files/components/FilesSummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const CalendarFeature = lazy(() => import('../../../default/calender/components/CalenderSummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const MailFeature = lazy(() => import('../../../default/mail/components/EmailSummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
// const WorkspaceFeature = lazy(() => import('../../workspace/components/WorkspaceSummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const ChatFeature = lazy(() => import('../../../default/chat/components/ChatSummaryView.tsx').catch(() => import('./FeaturePlaceholder.tsx')));
const DefaultFeature = lazy(() => import('./FeaturePlaceholder.tsx'));

export interface DetailPaneProps {
  environment: Environment;
  className?: string;
}

export function DetailPane({ environment, className }: DetailPaneProps) {
  // Use the feature store hook that automatically uses the current account
  const { currentFeature, accountId } = useFeatureStore();

  useEffect(() => {
    console.log(`[DetailPane] Loading feature: ${currentFeature} for account: ${accountId}`);
  }, [currentFeature, accountId]);

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
      // case 'workspace':
      //   return <WorkspaceFeature accountId={accountId} />
      case 'chat':
        return <ChatFeature accountId={accountId} />;
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