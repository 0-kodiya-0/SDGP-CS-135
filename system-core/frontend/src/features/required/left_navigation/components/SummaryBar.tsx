import { Calendar, File, Layout, Mail, MessageCircle, Users } from 'lucide-react';
import { SummarySection } from './SummarySection';
import { useFeatureStore, FeatureType } from '../store/useFeatureStore';

interface SummaryBarProps {
  className?: string;
}

export function SummaryBar({ className }: SummaryBarProps) {
  // Use the integrated feature store hook
  const { currentFeature, selectFeature } = useFeatureStore();

  const handleFeatureSelect = (feature: FeatureType) => {
    // Select the feature for the current account
    selectFeature(feature);
  };

  const isActive = (feature: FeatureType) => {
    return currentFeature === feature;
  };

  return (
    <div className={`bg-white border-r border-gray-200 py-4 flex-shrink-0 ${className}`}>
      <div className="flex flex-col space-y-4 items-center">
        {/* <SummarySection
          icon={<Layout className="w-6 h-6" />}
          title="Workspace"
          featureComponent={null}
          featureType="workspace"
          onSelect={() => handleFeatureSelect('workspace')}
          isActive={isActive('workspace')}
        /> */}
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
      </div>
    </div>
  );
}