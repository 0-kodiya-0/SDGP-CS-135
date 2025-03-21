import { Environment } from '../../../default/environment/types/types.data';
import SummaryView from '../../../Contact/SummaryView';
import { PersonType } from '../../../default/contacts';

export interface DetailPaneProps {
  environment: Environment;
  accountId: string;
  className?: string;
  onContactSelect?: (contact: PersonType) => void;
}

export function DetailPane({ environment, className, accountId, onContactSelect }: DetailPaneProps) {


  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>
      {/* The h-full ensures the component takes full height */}
      <SummaryView accountId={accountId} onContactSelect={onContactSelect}/>
    </div>
  );
}