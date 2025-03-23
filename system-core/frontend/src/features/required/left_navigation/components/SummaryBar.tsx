import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, File, Mail, Users } from 'lucide-react';
import { SummarySection } from './SummarySection';

interface SummaryBarProps {
  className?: string;
  accountId?: string;
}

export function SummaryBar({ className, accountId }: SummaryBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the current feature from the path
  const currentPath = location.pathname;
  const currentFeature = currentPath.split('/').pop() || '';
  
  // Extract the accountId from the URL if not provided as a prop
  const pathSegments = location.pathname.split('/');
  const urlAccountId = pathSegments.length >= 3 ? pathSegments[2] : null;
  const effectiveAccountId = accountId || urlAccountId;

  const handleFeatureSelect = (feature: string) => {
    if (!effectiveAccountId) {
      console.error('No accountId available for navigation');
      return;
    }
    
    // Construct the full path with account ID
    navigate(`/app/${effectiveAccountId}/${feature}`);
    console.log(`Navigating to: /app/${effectiveAccountId}/${feature}`);
  };

  const isActive = (feature: string) => {
    return currentFeature === feature;
  };

  return (
    <div className={`bg-white border-r border-gray-200 py-4 flex-shrink-0 ${className}`}>
      <div className="flex flex-col space-y-4 items-center">
        <SummarySection
          icon={<Users className="w-6 h-6" />}
          title="Contacts"
          featureComponent={null}
          featureType="contacts"
          onSelect={handleFeatureSelect}
          isActive={isActive('contacts')}
        />
        <SummarySection
          icon={<Mail className="w-6 h-6" />}
          title="Mail"
          featureComponent={null}
          featureType="mail"
          onSelect={handleFeatureSelect}
          isActive={isActive('mail')}
        />
        <SummarySection
          icon={<File className="w-6 h-6" />}
          title="Files"
          featureComponent={null}
          featureType="files"
          onSelect={handleFeatureSelect}
          isActive={isActive('files')}
        />
        <SummarySection
          icon={<Calendar className="w-6 h-6" />}
          title="Calendar"
          featureComponent={null}
          featureType="calendar"
          onSelect={handleFeatureSelect}
          isActive={isActive('calendar')}
        />
      </div>
    </div>
  );
}