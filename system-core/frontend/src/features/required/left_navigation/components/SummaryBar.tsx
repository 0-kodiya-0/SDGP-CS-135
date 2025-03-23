import { Calendar, File, Layout, Mail, Users } from 'lucide-react';
import { SummarySection } from './SummarySection';
import { useFeature, FeatureType } from '../context/FeatureContext';

interface SummaryBarProps {
  className?: string;
  accountId?: string;
}

export function SummaryBar({ className, accountId }: SummaryBarProps) {
  const { selectFeature, currentFeature } = useFeature();

  // Extract the accountId from props or use a default
  const effectiveAccountId = accountId || 'default';

  const handleFeatureSelect = (feature: FeatureType) => {
    if (!effectiveAccountId) {
      console.error('No accountId available for navigation');
      return;
    }

    // Select the feature using the context function
    selectFeature(feature);
  };

  const isActive = (feature: FeatureType) => {
    return currentFeature === feature;
  };

  return (
    <div className={`bg-white border-r border-gray-200 py-4 flex-shrink-0 ${className}`}>
      <div className="flex flex-col space-y-4 items-center">
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