import React from 'react';
import { Plugin } from '../layout-context';

interface PluginNavigationBarProps {
    plugins: Plugin[];
    selectedPluginId?: string;
    onPluginSelect: (pluginId: string) => void;
}

export const LeftNavigationBar: React.FC<PluginNavigationBarProps> = ({
    plugins,
    selectedPluginId,
    onPluginSelect
}) => {
    return (
        <div className='w-[10%] flex flex-col items-start justify-center'>
            {/* Left navigation for plugins to dynamically add */}
            <div className='w-full h-[80%] flex flex-col items-center py-4 space-y-4'>
                {plugins.map(plugin => (
                    <button
                        key={plugin.id}
                        onClick={() => onPluginSelect(plugin.id)}
                        className={`w-10 h-10 rounded-md flex items-center justify-center ${selectedPluginId === plugin.id ? 'bg-blue-100' : 'bg-gray-100'
                            }`}
                        title={plugin.name}
                    >
                        <img src={plugin.icon} alt={plugin.name} className="w-6 h-6" />
                    </button>
                ))}
            </div>

            {/* Left navigation system only */}
            <div className='w-full h-[20%] flex flex-col items-center py-4 space-y-4'>
                {/* System navigation items */}
                <button
                    className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center"
                    title="Add new"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <button
                    className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center"
                    title="Settings"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 2.5H11C11.1381 2.5 11.25 2.61193 11.25 2.75V17.25C11.25 17.3881 11.1381 17.5 11 17.5H9C8.86193 17.5 8.75 17.3881 8.75 17.25V2.75C8.75 2.61193 8.86193 2.5 9 2.5Z" fill="currentColor" />
                        <path d="M2.5 9V11C2.5 11.1381 2.61193 11.25 2.75 11.25H17.25C17.3881 11.25 17.5 11.1381 17.5 11V9C17.5 8.86193 17.3881 8.75 17.25 8.75H2.75C2.61193 8.75 2.5 8.86193 2.5 9Z" fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default LeftNavigationBar;