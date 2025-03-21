import { Panel } from 'react-resizable-panels';
import { DetailPane } from './DetailPane.tsx';
import { SummaryBar } from './SummaryBar.tsx';
import { Environment } from '../../../default/environment/types/types.data.ts';
import { PersonType } from '../../../default/contacts/index.ts';

interface NavigationProps {
  environment: Environment;
  accountId: string;
  summaryBarClassName?: string;
  detailPaneClassName?: string;
  onContactSelect?: (contact: PersonType) => void;
}

export function Navigation({ environment, summaryBarClassName, detailPaneClassName, accountId, onContactSelect }: NavigationProps) {
  return (
    <>
      <div className={`${summaryBarClassName}`}>
        <SummaryBar className='w-full h-full'/>
      </div>
      <Panel defaultSize={20} minSize={5} collapsible={true} collapsedSize={1} className="h-full">
        <DetailPane environment={environment} className={`${detailPaneClassName}`} accountId={accountId} onContactSelect={onContactSelect}/>
      </Panel>
    </>
  );
}