import { Panel } from 'react-resizable-panels';
import { DetailPane } from './DetailPane.tsx';
import { SummaryBar } from './SummaryBar.tsx';
import { Environment } from '../../../default/environment/types/types.data.ts';

interface NavigationProps {
  environment: Environment
  summaryBarClassName?: string;
  detailPaneClassName?: string;
  refreshTrigger: number;
  onFileChange: () => void;
  onFileSelect: (fileName: string | null) => void;
}

export function Navigation({ environment, summaryBarClassName, detailPaneClassName, onFileChange, onFileSelect, refreshTrigger }: NavigationProps) {

  return (
    <>
      <div className={`${summaryBarClassName}`}>
        <SummaryBar className='w-full h-full' />
      </div>
      <Panel defaultSize={20} minSize={5} collapsible={true} collapsedSize={1} className="h-full">
        <DetailPane environment={environment} className={`${detailPaneClassName}`} onFileChange={onFileChange} onFileSelect={onFileSelect} refreshTrigger={refreshTrigger} />
      </Panel>
    </>
  );
}