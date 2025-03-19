// src/features/required/left_navigation/Navigation.tsx
import { DetailPane } from './DetailPane';
import { SummaryBar } from './SummaryBar';
import { Environment } from '../../../default/environment/types/types.data';

interface NavigationProps {
  environment: Environment;
  summaryBarClassName?: string;
  detailPaneClassName?: string;
}

export function Navigation({ 
  environment, 
  summaryBarClassName, 
  detailPaneClassName
}: NavigationProps) {
  return (
    <div className="flex h-full">
      <SummaryBar className={summaryBarClassName} />
      <DetailPane 
        environment={environment} 
        className={detailPaneClassName} 
      />
    </div>
  );
}