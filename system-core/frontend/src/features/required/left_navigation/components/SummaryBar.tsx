import { Calendar, File, Layout, Mail, MessageCircle, Users, ChevronLeft } from 'lucide-react';
import { SummarySection } from './SummarySection';
import { useFeatureStore, FeatureType } from '../store/useFeatureStore';
import { WorkspaceView } from '../../workspace/components/WorkspaceView';
import { useWorkspaceStore } from '../../workspace/store/useWorkspaceStore';

interface SummaryBarProps {
  className?: string;
}

export function SummaryBar({ className }: SummaryBarProps) {
  // Use the integrated feature store hook
  const { currentFeature, selectFeature } = useFeatureStore();
  const { selectedWorkspace, deselectWorkspace } = useWorkspaceStore();

  const handleFeatureSelect = (feature: FeatureType) => {
    // Select the feature for the current account
    selectFeature(feature);
  };

  const isActive = (feature: FeatureType) => {
    return currentFeature === feature;
  };

  const handleBackToWorkspaces = () => {
    deselectWorkspace();
    selectFeature('workspace' as FeatureType);
  };

  return (
    <div className={`bg-white border-r border-gray-200 py-4 flex-shrink-0 ${className}`}>
      <div className="flex flex-col space-y-4 items-center">
        {currentFeature === 'workspace' ? (
          <WorkspaceView />
        ) : selectedWorkspace ? (
          <>
            <button
              className="w-12 h-12 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
              onClick={handleBackToWorkspaces}
              title="Back to workspaces"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <SummarySection
              icon={<Users className="w-6 h-6" />}
              title="Workspace Contacts"
              featureComponent={null}
              featureType="workspace-contacts"
              onSelect={() => handleFeatureSelect('workspace-contacts')}
              isActive={isActive('workspace-contacts')}
            />
            <SummarySection
              icon={<Mail className="w-6 h-6" />}
              title="Workspace Mail"
              featureComponent={null}
              featureType="workspace-mail"
              onSelect={() => handleFeatureSelect('workspace-mail')}
              isActive={isActive('workspace-mail')}
            />
            <SummarySection
              icon={<MessageCircle className="w-6 h-6" />}
              title="Workspace Chat"
              featureComponent={null}
              featureType="workspace-chat"
              onSelect={() => handleFeatureSelect('workspace-chat')}
              isActive={isActive('workspace-chat')}
            />
            <SummarySection
              icon={<File className="w-6 h-6" />}
              title="Workspace Files"
              featureComponent={null}
              featureType="workspace-files"
              onSelect={() => handleFeatureSelect('workspace-files')}
              isActive={isActive('workspace-files')}
            />
            <SummarySection
              icon={<Calendar className="w-6 h-6" />}
              title="Workspace Calendar"
              featureComponent={null}
              featureType="workspace-calendar"
              onSelect={() => handleFeatureSelect('workspace-calendar')}
              isActive={isActive('workspace-calendar')}
            />
          </>
        ) : (
          <>
            <SummarySection
              icon={<Layout className="w-6 h-6" />}
              title="Workspace"
              featureComponent={null}
              featureType="workspace"
              onSelect={() => handleFeatureSelect('workspace')}
              isActive={isActive('workspace')}
            />
            <SummarySection
              icon={<Users className="w-6 h-6" />}
              title="Contacts"
              featureComponent={null}
              featureType="contacts"
              onSelect={() => handleFeatureSelect('contacts')}
              isActive={isActive('contacts')}
            />
            <SummarySection
              icon={<Mail className="w-6 h-6" />}
              title="Mail"
              featureComponent={null}
              featureType="mail"
              onSelect={() => handleFeatureSelect('mail')}
              isActive={isActive('mail')}
            />
            <SummarySection
              icon={<MessageCircle className="w-6 h-6" />}
              title="Chat"
              featureComponent={null}
              featureType="chat"
              onSelect={() => handleFeatureSelect('chat')}
              isActive={isActive('chat')}
            />
            <SummarySection
              icon={<File className="w-6 h-6" />}
              title="Files"
              featureComponent={null}
              featureType="files"
              onSelect={() => handleFeatureSelect('files')}
              isActive={isActive('files')}
            />
            <SummarySection
              icon={<Calendar className="w-6 h-6" />}
              title="Calendar"
              featureComponent={null}
              featureType="calendar"
              onSelect={() => handleFeatureSelect('calendar')}
              isActive={isActive('calendar')}
            />
          </>
        )}
      </div>
    </div>
  );
}