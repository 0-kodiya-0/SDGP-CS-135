// types.data.ts
import React from 'react';

export interface Tab {
    id: string;
    title: string;
    content?: React.ReactNode; // Optional because it might not be present after deserialization
    componentType?: string;    // The name/path of the component to load dynamically
    props?: Record<string, any>; // Props to pass to the component when restoring
}

export interface SerializedTab {
    id: string;
    title: string;
    componentType?: string;
    props?: Record<string, any>;
}