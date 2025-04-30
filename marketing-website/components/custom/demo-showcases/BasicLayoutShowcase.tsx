import React, { useState } from 'react';
import { Menu, Settings, Search } from 'lucide-react';

interface LayoutSection {
    id: string;
    title: string;
    description: string;
    gridArea?: string;
}

const layoutSections: LayoutSection[] = [
    {
        id: 'navbar',
        title: 'Navigation Bar',
        description: 'Main navigation containing environment selector, search, and user settings',
    },
    {
        id: 'sidebar',
        title: 'Environment Sidebar',
        description: 'Manage workspaces and environments',
    },
    {
        id: 'workspace',
        title: 'Workspace Navigation',
        description: 'Access workspace features like members, apps, and files',
    },
    {
        id: 'content',
        title: 'Content Area',
        description: 'Main workspace content and tab management',
    },
    {
        id: 'footer',
        title: 'Status Bar',
        description: 'System status and additional tools',
    }
];

const BasicLayoutShowcase = () => {
    const [activeSection, setActiveSection] = useState<string | null>(null);

    return (
        <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden relative">
            {/* Navbar */}
            <div
                className={`h-12 min-h-[3rem] border-b flex items-center px-4 transition-colors duration-200 ${activeSection === 'navbar' ? 'bg-blue-50' : 'bg-white'
                    }`}
                onMouseEnter={() => setActiveSection('navbar')}
                onMouseLeave={() => setActiveSection(null)}
            >
                <div className="w-16 flex items-center justify-center flex-shrink-0">
                    <Menu className="w-5 h-5 text-gray-600" />
                </div>
                <div className="w-64 border-x h-full flex items-center px-4">
                    <span className="text-sm font-medium text-gray-700">Environment</span>
                </div>
                <div className="flex-1 flex items-center justify-end space-x-2">
                    <Search className="w-5 h-5 text-gray-600" />
                    <Settings className="w-5 h-5 text-gray-600" />
                </div>
            </div>

            <div className="flex flex-1 min-h-0">
                {/* Sidebar */}
                <div
                    className={`w-16 border-r flex flex-col items-center py-4 transition-colors duration-200 ${activeSection === 'sidebar' ? 'bg-blue-50' : 'bg-white'
                        }`}
                    onMouseEnter={() => setActiveSection('sidebar')}
                    onMouseLeave={() => setActiveSection(null)}
                >
                    <div className="w-8 h-8 bg-gray-200 rounded-lg mb-4" />
                    <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                </div>

                {/* Workspace Navigation */}
                <div
                    className={`w-64 border-r flex flex-col transition-colors duration-200 ${activeSection === 'workspace' ? 'bg-blue-50' : 'bg-white'
                        }`}
                    onMouseEnter={() => setActiveSection('workspace')}
                    onMouseLeave={() => setActiveSection(null)}
                >
                    <div className="p-4">
                        <div className="h-8 bg-gray-200 rounded mb-4" />
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-6 bg-gray-200 rounded w-1/2" />
                    </div>
                </div>

                {/* Content Area */}
                <div
                    className={`flex-1 flex flex-col min-w-0 transition-colors duration-200 ${activeSection === 'content' ? 'bg-blue-50' : 'bg-white'
                        }`}
                    onMouseEnter={() => setActiveSection('content')}
                    onMouseLeave={() => setActiveSection(null)}
                >
                    <div className="h-10 border-b flex items-center px-4">
                        <div className="h-6 bg-gray-200 rounded w-32" />
                    </div>
                    <div className="flex-1 p-4 min-h-0">
                        <div className="h-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                            <span className="text-gray-500">Content Area</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                className={`h-8 min-h-[2rem] border-t flex items-center px-4 transition-colors duration-200 ${activeSection === 'footer' ? 'bg-blue-50' : 'bg-white'
                    }`}
                onMouseEnter={() => setActiveSection('footer')}
                onMouseLeave={() => setActiveSection(null)}
            >
                <div className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-4 bg-gray-200 rounded w-24" />
                </div>
            </div>

            {/* Section Info Overlay */}
            {activeSection && (
                <div className="absolute right-4 bottom-12 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                    {layoutSections.find(section => section.id === activeSection) && (
                        <>
                            <h3 className="font-medium text-gray-900 mb-1">
                                {layoutSections.find(section => section.id === activeSection)?.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {layoutSections.find(section => section.id === activeSection)?.description}
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default BasicLayoutShowcase;