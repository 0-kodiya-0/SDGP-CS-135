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
    const [dropThresholds, setDropThresholds] = useState<{ horizontal: number, vertical: number }>({ horizontal: 80, vertical: 80 });
    const groupRef = useRef<HTMLDivElement>(null);

    const { moveTab, createTabView, removeTabView } = useTabStore();
    const { addItem } = useTreeStore();

    // Calculate drop zone based on mouse position
    const calculateDropZone = (x: number, y: number, width: number, height: number): { zone: 'center' | 'left' | 'right' | 'top' | 'bottom', thresholds: { horizontal: number, vertical: number } } => {
        // Use a percentage-based threshold that's smaller for larger panels
        const percentageThreshold = 0.2; // 20% of the dimension
        const minimumThreshold = 30; // Minimum 30 pixels
        const maximumThreshold = 80; // Maximum 80 pixels
        
        // Calculate thresholds based on panel size, but keep them within bounds
        const horizontalThreshold = Math.min(
            maximumThreshold,
            Math.max(minimumThreshold, width * percentageThreshold)
        );
        const verticalThreshold = Math.min(
            maximumThreshold,
            Math.max(minimumThreshold, height * percentageThreshold)
        );

        // Check edges with calculated thresholds
        let zone: 'center' | 'left' | 'right' | 'top' | 'bottom' = 'center';
        if (x < horizontalThreshold) zone = 'left';
        else if (x > width - horizontalThreshold) zone = 'right';
        else if (y < verticalThreshold) zone = 'top';
        else if (y > height - verticalThreshold) zone = 'bottom';
        
        return { zone, thresholds: { horizontal: horizontalThreshold, vertical: verticalThreshold } };
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
            const { zone, thresholds } = calculateDropZone(x, y, rect.width, rect.height);
            setDropZone(zone);
            setDropThresholds(thresholds);
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
                const { zone } = calculateDropZone(x, y, rect.width, rect.height);
                currentDropZone = zone;
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
                
                // Determine position based on drop zone
                // For left/top, new item should come before existing item
                // For right/bottom, new item should come after existing item
                const position = (currentDropZone === 'left' || currentDropZone === 'top') ? 'before' : 'after';
                
                // Then add the tree item with the proper split direction and position
                // Pass the accountId to the addItem method
                addItem(accountId, item.title, node.id, splitDirection, newTabViewId, position);

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

    // Handle removal callback (for manual removal, not automatic due to empty TabView)
    const handleRemoval = () => {
        if (node.tabItem) {
            onRemove(node.tabItem.id);
        }
    };

    // This useEffect handles the case where a TabView becomes empty due to tabs being moved/closed
    // It's necessary because the TabManagement component can't directly trigger tree updates
    useEffect(() => {
        const handleTabViewEmpty = (event: CustomEvent) => {
            const { accountId: eventAccountId, tabViewId } = event.detail;
            
            // Check if this event is for our TabView
            if (eventAccountId === accountId && node.tabItem?.tabViewId === tabViewId) {
                // Remove the TabView from the store first
                removeTabView(accountId, tabViewId);
                
                // Then remove this GroupPanel from the tree structure
                if (node.tabItem) {
                    onRemove(node.tabItem.id);
                }
            }
        };

        // Listen for custom events from TabManagement when a TabView becomes empty
        window.addEventListener('tabview-empty', handleTabViewEmpty as EventListener);
        
        return () => {
            window.removeEventListener('tabview-empty', handleTabViewEmpty as EventListener);
        };
    }, [accountId, node.tabItem]);
    
    // Reset dropZone when drag leaves
    useEffect(() => {
        if (!isOver) {
            setDropZone(null);
        }
    }, [isOver]);

    return (
        <div
            key={node.id}
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
                <div key={`dropzone-${node.id}-${dropZone}`} className="absolute inset-0 pointer-events-none z-10">
                    <div className={`
                        absolute bg-blue-500 bg-opacity-30 transition-all duration-200
                        ${dropZone === 'left' ? `left-0 top-0 bottom-0` : ''}
                        ${dropZone === 'right' ? `right-0 top-0 bottom-0` : ''}
                        ${dropZone === 'top' ? `top-0 left-0 right-0` : ''}
                        ${dropZone === 'bottom' ? `bottom-0 left-0 right-0` : ''}
                        ${dropZone === 'center' ? 'inset-2 border-2 border-blue-500 border-dashed rounded' : ''}
                    `} 
                    style={{
                        ...(dropZone === 'left' && { width: `${dropThresholds.horizontal}px` }),
                        ...(dropZone === 'right' && { width: `${dropThresholds.horizontal}px` }),
                        ...(dropZone === 'top' && { height: `${dropThresholds.vertical}px` }),
                        ...(dropZone === 'bottom' && { height: `${dropThresholds.vertical}px` }),
                    }}
                    />
                </div>
            )}

            <TabView
                key={`tabview-${node.tabItem?.tabViewId || node.id}`}
                accountId={accountId}
                tabViewId={node.tabItem?.tabViewId || undefined}
                removeGroup={handleRemoval}
                className="h-full"
            />
        </div>
    );
};

export default GroupPanel;