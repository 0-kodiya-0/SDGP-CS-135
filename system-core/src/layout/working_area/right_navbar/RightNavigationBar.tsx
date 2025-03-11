import React, { useState } from 'react';

interface Shortcut {
    id: string;
    icon: string; // Icon identifier
    title: string;
    action?: () => void;
}

interface ShortcutBarProps {
    shortcuts?: Shortcut[];
    onShortcutClick?: (shortcutId: string) => void;
}

export const ShortcutBar: React.FC<ShortcutBarProps> = ({ shortcuts: externalShortcuts, onShortcutClick }) => {
    // Default shortcuts if none provided
    const defaultShortcuts: Shortcut[] = [
        { id: 'shortcut-1', icon: 'plus', title: 'Add new item' },
        { id: 'shortcut-2', icon: 'view', title: 'Change view' },
    ];

    // Use provided shortcuts or default ones
    const shortcuts = externalShortcuts || defaultShortcuts;

    // Handle shortcut actions
    const handleShortcutClick = (shortcutId: string) => {
        // If an external handler is provided, use it
        if (onShortcutClick) {
            onShortcutClick(shortcutId);
            return;
        }

        // Otherwise, find the shortcut and execute its action if defined
        const shortcut = shortcuts.find(s => s.id === shortcutId);
        if (shortcut?.action) {
            shortcut.action();
        } else {
            console.log(`Shortcut clicked: ${shortcutId}`);
        }
    };

    // Helper to render the appropriate icon based on icon identifier
    const renderIcon = (icon: string) => {
        switch (icon) {
            case 'plus':
                return (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2.5V17.5M2.5 10H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            case 'view':
                return (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
            default:
                return (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 2.5V17.5M2.5 10H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                );
        }
    };

    return (
        <div className='w-[5%] flex flex-col items-center py-4 border-l'>
            <div className="space-y-4">
                {shortcuts.map((shortcut) => (
                    <button
                        key={shortcut.id}
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => handleShortcutClick(shortcut.id)}
                        title={shortcut.title}
                    >
                        {renderIcon(shortcut.icon)}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ShortcutBar;