// src/features/required/left_navigation/components/DetailPane.tsx
import ContactSummaryView from '../../../members/SummaryView';
import { Environment } from '../../../default/environment/types/types.data';
import { usePeople } from '../../../../contexts/PeopleContext';

export interface DetailPaneProps {
  environment: Environment;
  className?: string;
}

export function DetailPane({ environment, className }: DetailPaneProps) {
  const { selectContact } = usePeople();

  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>
      {/* The h-full ensures the component takes full height */}
      <ContactSummaryView 
        environment={environment}
        onContactSelect={selectContact}
      />
    </div>
  );
}