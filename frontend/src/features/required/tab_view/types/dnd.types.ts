export const ItemTypes = {
  TAB: 'tab'
} as const;

export interface DraggedTabItem {
  type: typeof ItemTypes.TAB;
  id: string;
  title: string;
  componentType?: string;
  props?: Record<string, any>;
  sourceTabViewId: string;
  accountId: string;
}

export interface DropResult {
  tabViewId?: string;
  dropType: 'center' | 'left' | 'right' | 'top' | 'bottom';
  groupId: string;
}