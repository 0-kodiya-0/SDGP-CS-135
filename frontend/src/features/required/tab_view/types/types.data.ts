// Updated Tab interface without content
export interface Tab {
    id: string;
    title: string;
    componentType?: string;    // The name/path of the component to load dynamically
    props?: Record<string, any>; // Props to pass to the component when restoring
    tabViewId: string;  // Associate tab with specific TabView
}

export interface SerializedTab {
    id: string;
    title: string;
    componentType?: string;
    props?: Record<string, any>;
    tabViewId: string;  // Associate tab with specific TabView
}