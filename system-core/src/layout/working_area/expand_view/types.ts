export interface TabItem {
    id: string;
    name: string;
    pluginId: string;
    component?: React.ComponentType;
    icon?: string;
    closable?: boolean;
    data?: any;
}