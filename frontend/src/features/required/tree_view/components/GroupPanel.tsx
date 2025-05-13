import { TabView } from '../../tab_view';
import { GroupPanelProps } from '../types/types.props';

const GroupPanel = ({
    node,
    isSelected,
    onSelect,
    onRemove,
    accountId
}: GroupPanelProps) => {
    // Handle removal callback from TabView
    const handleRemoval = () => {
        if (node.tabItem) {
            onRemove(node.tabItem.id);
        }
    };

    return (
        <div
            className={`
                flex flex-col w-full h-full
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
            `}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(node.id);
            }}
        >
            {/* TabView replaces the previous content section */}
            <TabView
                accountId={accountId}
                tabViewId={node.tabItem?.tabViewId || undefined}
                removeGroup={handleRemoval}
                className="h-full"
            />
        </div>
    );
}

export default GroupPanel;