import { EnvironmentStatus } from "../types/types.data.ts";
import { EnvironmentCardProps } from "../types/types.props.ts";

export const EnvironmentCard: React.FC<EnvironmentCardProps> = ({
    environment,
    isSelected,
    onSelect
}) => {
    return (
        <button
            onClick={onSelect}
            className={`
        flex-shrink-0 w-[200px] aspect-video rounded-md p-3
        transition-all duration-200 group relative
        ${isSelected
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }
      `}
        >
            <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 truncate">
                    {environment.name}
                </span>
            </div>

            {environment.status !== EnvironmentStatus.Active && (
                <div className="absolute bottom-2 right-2">
                    <span className={`
            text-xs px-1.5 py-0.5 rounded-full
            ${environment.status === EnvironmentStatus.Archived
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-red-100 text-red-600'
                        }
          `}>
                        {environment.status.toLowerCase()}
                    </span>
                </div>
            )}
        </button>
    );
};