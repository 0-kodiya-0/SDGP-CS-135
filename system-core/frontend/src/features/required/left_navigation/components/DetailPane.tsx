// src/features/required/left_navigation/components/DetailPane.tsx
import { Environment } from '../../../default/environment/types/types.data';
import ContactsList from '../../../members/components/ContactsList';

export interface DetailPaneProps {
  environment: Environment;
  className?: string;
}

export function DetailPane({ environment, className }: DetailPaneProps) {
  const { selectContact } = usePeople();


  return (
    <div className={`bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>
      {/* The h-full ensures the component takes full height */}
      <ContactsList accountId={'5f4888af546871226db0fe6a71b93b97'}/>
    </div>
  );
}