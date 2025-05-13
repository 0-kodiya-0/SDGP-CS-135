import { useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { TabView } from '../../tab_view';
import { SplitDirection, TreeNode } from '../types/types.data';
import { ItemTypes, DraggedTabItem, DropResult } from '../../tab_view/types/dnd.types';
import { useTabStore } from '../../tab_view/store/useTabStore';
import { useTreeStore } from '../store/useTreeStore';

interface GroupPanelProps {
    node: TreeNode;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onRemove: (itemId: string) => void;
    accountId: string;
}

const GroupPanel = ({
    node,
    isSelected,
    onSelect,
    onRemove,
    accountId
}: GroupPanelProps) => {
    const [dropZone, setDropZone] = useState<'center' | 'left' | 'right' | 'top' | 'bottom' | null>(null);
    const groupRef = useRef<HTMLDivElement>(null);

    const { moveTab, createTabView, removeTabView } = useTabStore();
    const { addItem } = useTreeStore();

    useEffect(() => {
        const handleTabViewEmpty = (event: CustomEvent) => {
            const { accountId: eventAccountId, tabViewId } = event.detail;
            
            // Check if this event is for our TabView
            if (eventAccountId === accountId && node.tabItem?.tabViewId === tabViewId) {
                // Remove the TabView from the store
                removeTabView(accountId, tabViewId);
                
                // Remove this GroupPanel (trigger the tree update)
                if (node.tabItem) {
                    onRemove(node.tabItem.id);
                }
            }
        };

        // Add event listener for TabView empty events
        window.addEventListener('tabview-empty', handleTabViewEmpty as EventListener);
        
        return () => {
            window.removeEventListener('tabview-empty', handleTabViewEmpty as EventListener);
        };
    }, [accountId, node.tabItem]);

    // Calculate drop zone based on mouse position
    const calculateDropZone = (x: number, y: number, width: number, height: number): 'center' | 'left' | 'right' | 'top' | 'bottom' => {
        const threshold = 50; // pixels from edge

        if (x < threshold) return 'left';
        if (x > width - threshold) return 'right';
        if (y < threshold) return 'top';
        if (y > height - threshold) return 'bottom';
        return 'center';
    };

    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.TAB,
        hover: (item: DraggedTabItem, monitor) => {
            if (!groupRef.current) return;

            const rect = groupRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();

            if (!clientOffset) {
                setDropZone(null);
                return;
            }

            const x = clientOffset.x - rect.left;
            const y = clientOffset.y - rect.top;

            // Calculate drop zone for visual feedback only
            const zone = calculateDropZone(x, y, rect.width, rect.height);
            setDropZone(zone);
        },
        drop: (item: DraggedTabItem, monitor): DropResult => {
            // Calculate drop zone at the moment of drop
            if (!groupRef.current) return { dropType: 'center', groupId: node.id };

            const rect = groupRef.current.getBoundingClientRect();
            const clientOffset = monitor.getClientOffset();

            // Default to center if we can't get client offset
            let currentDropZone: 'center' | 'left' | 'right' | 'top' | 'bottom' = 'center';

            if (clientOffset) {
                const x = clientOffset.x - rect.left;
                const y = clientOffset.y - rect.top;
                currentDropZone = calculateDropZone(x, y, rect.width, rect.height);
            }

            // Handle the drop based on calculated zone
            if (currentDropZone === 'center') {
                // Move tab to this TabView
                if (node.tabItem?.tabViewId && item.accountId === accountId) {
                    moveTab(accountId, item.id, node.tabItem.tabViewId);
                }
            } else {
                // Create new split
                const splitDirection = currentDropZone === 'left' || currentDropZone === 'right' ? SplitDirection.HORIZONTAL : SplitDirection.VERTICAL;

                // Generate new TabView ID
                const newTabViewId = crypto.randomUUID();
                
                // First create the TabView in the store
                createTabView(accountId, newTabViewId);
                
                // Then add the tree item with the proper split direction
                addItem(item.title, node.id, splitDirection, newTabViewId);

                // Finally move the tab to the new TabView
                moveTab(item.accountId, item.id, newTabViewId);
            }

            // Reset visual state after drop
            setDropZone(null);

            return {
                dropType: currentDropZone,
                groupId: node.id,
                tabViewId: node.tabItem?.tabViewId
            };
        },
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true })
        }),
    }));

    // Combine refs
    const combinedRef = (el: HTMLDivElement) => {
        groupRef.current = el;
        drop(el);
    };

    // Reset dropZone when drag leaves
    useEffect(() => {
        if (!isOver) {
            setDropZone(null);
        }
    }, [isOver]);

    // Handle removal callback
    const handleRemoval = () => {
        if (node.tabItem) {
            onRemove(node.tabItem.id);
        }
    };

    return (
        <div
            ref={combinedRef}
            className={`
                relative flex flex-col w-full h-full
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                ${isOver ? 'ring-2 ring-green-500' : ''}
            `}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(node.id);
            }}
        >
            {/* Drop zone indicators */}
            {isOver && dropZone && (
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div className={`
                        absolute bg-blue-500 bg-opacity-30 transition-all duration-200
                        ${dropZone === 'left' ? 'left-0 top-0 bottom-0 w-8' : ''}
                        ${dropZone === 'right' ? 'right-0 top-0 bottom-0 w-8' : ''}
                        ${dropZone === 'top' ? 'top-0 left-0 right-0 h-8' : ''}
                        ${dropZone === 'bottom' ? 'bottom-0 left-0 right-0 h-8' : ''}
                        ${dropZone === 'center' ? 'inset-2 border-2 border-blue-500 border-dashed rounded' : ''}
                    `} />
                </div>
            )}

            <TabView
                accountId={accountId}
                tabViewId={node.tabItem?.tabViewId || undefined}
                removeGroup={handleRemoval}
                className="h-full"
            />
        </div>
    );
};

export default GroupPanel;