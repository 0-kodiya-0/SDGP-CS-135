import { Environment } from '../../../default/environment/types/types.data.ts';

interface DetailPaneProps {
  environment: Environment;
  className?: string;
}

export function DetailPane({ environment, className }: DetailPaneProps) {

  return (
    <div
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${className}`}
    >
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center px-2 flex-shrink-0 overflow-hidden justify-between">
        <div className={`transition-opacity duration-300`}>
          <span className="ml-2 text-sm font-medium text-gray-900 truncate">
            <h1></h1>
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 p-4 opacity-100 w-full 
                custom-scrollbar
            `}
      >
        <h1></h1>
      </div>
    </div>
  );
}