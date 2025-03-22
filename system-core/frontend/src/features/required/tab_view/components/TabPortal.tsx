import React, { useEffect } from 'react';
import { useTabs } from '../context/TabContext';

interface TabPortalProps {
    title: string;
    children: React.ReactNode;
    openOnMount?: boolean;
}

export const TabPortal: React.FC<TabPortalProps> = ({
    title,
    children,
    openOnMount = true
}) => {
    const { addTab } = useTabs();

    useEffect(() => {
        if (openOnMount) {
            addTab(title, children);
        }
    }, [addTab, children, openOnMount, title]);

    return null;
};

export default TabPortal;