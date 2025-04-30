import React from 'react';
import { motion } from 'framer-motion';
import {
    Menu,
    Search,
    Settings,
    Plus,
    FileText,
    MessageSquare,
    CheckSquare,
    Bell,
    Calendar,
    Users,
    MoreVertical,
    ChevronRight
} from 'lucide-react';
import ContentContainer from '@/layouts/ContentContainer';

export const InterfacePreview: React.FC = () => {
    return (
        <ContentContainer className='py-12 md:py-16 lg:py-24'>
            <motion.div
                className="relative z-10 mt-12"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.6 }}
            >
                <div className="relative mx-auto max-w-5xl">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 h-[560px]">
                        {/* Full interface preview */}
                        <div className="flex flex-col h-full bg-white">
                            {/* Top navigation bar */}
                            <nav className="h-12 border-b flex items-center bg-white">
                                <div className="w-16 flex items-center justify-center flex-shrink-0">
                                    <button className="p-1.5 hover:bg-gray-100 rounded">
                                        <Menu className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="w-64 border-x flex items-center h-full transition-all duration-200 ease-in-out">
                                    <div className="flex items-center h-full w-full">
                                        <button className="flex-1 h-full px-4 flex items-center min-w-0 transition-colors hover:bg-gray-50">
                                            <div className="flex items-center min-w-0 w-full">
                                                <div className="w-5 h-5 rounded-full bg-blue-500 flex-shrink-0 mr-2 flex items-center justify-center text-white text-xs font-medium">
                                                    D
                                                </div>
                                                <span className="text-sm font-medium truncate">Development</span>
                                            </div>
                                        </button>
                                        <div className="h-full border-l border-gray-200 relative">
                                            <button className="h-full w-10 flex items-center justify-center transition-colors hover:bg-gray-50" aria-label="Environment options">
                                                <MoreVertical className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right side controls */}
                                <div className="flex-1 flex items-center justify-end px-4 space-x-2">
                                    {/* Search input */}
                                    <div className="relative max-w-md">
                                        <input
                                            type="text"
                                            placeholder="Search"
                                            className="w-64 pl-8 pr-4 py-1.5 text-sm bg-gray-50 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-200"
                                        />
                                        <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
                                    </div>

                                    {/* Notification button */}
                                    <button className="p-1.5 hover:bg-gray-100 rounded relative">
                                        <Bell className="w-5 h-5 text-gray-600" />
                                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                                    </button>

                                    {/* Settings button */}
                                    <button className="p-1.5 hover:bg-gray-100 rounded">
                                        <Settings className="w-5 h-5 text-gray-600" />
                                    </button>

                                    {/* User profile button */}
                                    <button className="p-1.5 hover:bg-gray-100 rounded relative" aria-label="User account menu">
                                        <div className="bg-indigo-500 text-white rounded-full flex items-center justify-center flex-shrink-0 w-7 h-7 text-xs relative">
                                            <span>JD</span>
                                        </div>
                                    </button>
                                </div>
                            </nav>

                            {/* Main content area with horizontal navigation */}
                            <div className="w-full h-full overflow-hidden flex">
                                {/* Left environment column */}
                                <div className="w-16 h-full">
                                    <div className="bg-white border-r border-gray-200 py-4 flex-shrink-0 w-full h-full">
                                        <div className="flex flex-col space-y-4">
                                            <div className="flex flex-col gap-y-2 px-2">
                                                <button
                                                    className="relative w-full aspect-square rounded-lg flex items-center justify-center transition-colors duration-200 bg-blue-100 text-blue-700"
                                                    title="Development Workspace"
                                                >
                                                    <span className="text-sm font-medium">D</span>
                                                </button>

                                                <button
                                                    className="relative w-full aspect-square rounded-lg flex items-center justify-center transition-colors duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    title="Research Workspace"
                                                >
                                                    <span className="text-sm font-medium">R</span>
                                                </button>

                                                <button
                                                    className="relative w-full aspect-square rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-gray-100"
                                                    title="Add Workspace"
                                                >
                                                    <Plus className="w-5 h-5 text-gray-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Workspace detail column */}
                                <div className="h-full w-64" style={{ overflow: 'hidden' }}>
                                    <div className="bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out min-w-64 h-full overflow-hidden">
                                        {/* Workspace header */}
                                        <div className="h-12 border-b border-gray-200 flex items-center px-4 justify-between flex-shrink-0 overflow-hidden">
                                            <div className="transition-opacity duration-300">
                                                <span className="text-sm font-medium text-gray-900 truncate">Project Features</span>
                                            </div>
                                            <button className="p-1 rounded-md hover:bg-gray-100">
                                                <Plus className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>

                                        {/* Workspace content */}
                                        <div className="flex-1 overflow-y-auto transition-all duration-300 px-2 py-2 opacity-100 w-full">
                                            <div className="space-y-1">
                                                {/* Files section */}
                                                <div className="group">
                                                    <button className="w-full py-1.5 px-2 flex items-center justify-between hover:bg-gray-50 rounded transition-colors">
                                                        <div className="flex items-center space-x-2">
                                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                                            <div className="flex items-center space-x-2">
                                                                <FileText className="w-4 h-4 text-blue-500" />
                                                                <span className="text-sm font-medium text-gray-700">Documentation</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>

                                                {/* Team section */}
                                                <div className="group">
                                                    <button className="w-full py-1.5 px-2 flex items-center justify-between hover:bg-gray-50 rounded transition-colors bg-blue-50">
                                                        <div className="flex items-center space-x-2">
                                                            <ChevronRight className="w-4 h-4 text-blue-500 transform rotate-90" />
                                                            <div className="flex items-center space-x-2">
                                                                <Users className="w-4 h-4 text-blue-500" />
                                                                <span className="text-sm font-medium text-gray-900">Team Members</span>
                                                            </div>
                                                        </div>
                                                    </button>

                                                    {/* Team submenu */}
                                                    <div className="pl-8 mt-1 space-y-1">
                                                        <button className="w-full py-1 px-2 flex items-center text-left hover:bg-gray-50 rounded transition-colors">
                                                            <span className="text-xs font-medium text-gray-600 truncate flex-1">Frontend Team</span>
                                                        </button>
                                                        <button className="w-full py-1 px-2 flex items-center text-left hover:bg-gray-50 rounded transition-colors bg-blue-100">
                                                            <span className="text-xs font-medium text-blue-700 truncate flex-1">Backend Team</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Calendar section */}
                                                <div className="group">
                                                    <button className="w-full py-1.5 px-2 flex items-center justify-between hover:bg-gray-50 rounded transition-colors">
                                                        <div className="flex items-center space-x-2">
                                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                                            <div className="flex items-center space-x-2">
                                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                                <span className="text-sm font-medium text-gray-700">Schedule</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>

                                                {/* Tasks section */}
                                                <div className="group">
                                                    <button className="w-full py-1.5 px-2 flex items-center justify-between hover:bg-gray-50 rounded transition-colors">
                                                        <div className="flex items-center space-x-2">
                                                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                                            <div className="flex items-center space-x-2">
                                                                <CheckSquare className="w-4 h-4 text-blue-500" />
                                                                <span className="text-sm font-medium text-gray-700">Tasks</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main content area with sidebar */}
                                <div className="h-full flex-1 flex flex-col">
                                    {/* Tab bar */}
                                    <div className="flex border-b border-gray-200 flex-shrink-0 bg-white w-full">
                                        <div className="flex items-center">
                                            {/* Active tab */}
                                            <div className="flex items-center h-9 px-3 border-r border-gray-200 bg-white relative">
                                                <Users className="w-3.5 h-3.5 text-gray-600 mr-1.5" />
                                                <span className="text-xs font-medium text-gray-700 pr-1">Team Members</span>
                                                <button className="ml-1 h-4 w-4 flex items-center justify-center rounded-full hover:bg-gray-100">
                                                    <svg width="8" height="8" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                                            </div>

                                            {/* Inactive tab */}
                                            <div className="flex items-center h-9 px-3 border-r border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <CheckSquare className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                                                <span className="text-xs font-medium text-gray-500 pr-1">Tasks</span>
                                                <button className="ml-1 h-4 w-4 flex items-center justify-center rounded-full hover:bg-gray-200">
                                                    <svg width="8" height="8" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <button className="h-9 w-9 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tab content */}
                                    <div className="flex-grow flex overflow-hidden">
                                        {/* Content area */}
                                        <div className="flex-grow overflow-auto p-4 bg-white">
                                            <div className="mb-4">
                                                <h2 className="text-lg font-semibold mb-2">Backend Team</h2>
                                                <p className="text-sm text-gray-600">Team responsible for API development and server infrastructure.</p>
                                            </div>

                                            {/* Team members grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                                {/* Team member card */}
                                                <div className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex-shrink-0 mr-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                                                            JD
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">John Doe</p>
                                                        <p className="text-xs text-gray-500">Lead Developer</p>
                                                        <div className="flex items-center mt-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></div>
                                                            <span className="text-xs text-green-600">Online</span>
                                                        </div>
                                                    </div>
                                                    <button className="p-1 hover:bg-gray-100 rounded">
                                                        <MessageSquare className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>

                                                {/* Team member card */}
                                                <div className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex-shrink-0 mr-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-medium">
                                                            AS
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">Alice Smith</p>
                                                        <p className="text-xs text-gray-500">Database Engineer</p>
                                                        <div className="flex items-center mt-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></div>
                                                            <span className="text-xs text-green-600">Online</span>
                                                        </div>
                                                    </div>
                                                    <button className="p-1 hover:bg-gray-100 rounded">
                                                        <MessageSquare className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>

                                                {/* Team member card */}
                                                <div className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex-shrink-0 mr-3">
                                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium">
                                                            RJ
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">Robert Johnson</p>
                                                        <p className="text-xs text-gray-500">DevOps Engineer</p>
                                                        <div className="flex items-center mt-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-gray-300 mr-1"></div>
                                                            <span className="text-xs text-gray-500">Away</span>
                                                        </div>
                                                    </div>
                                                    <button className="p-1 hover:bg-gray-100 rounded">
                                                        <MessageSquare className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>

                                                {/* Team member card */}
                                                <div className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex-shrink-0 mr-3">
                                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium">
                                                            EL
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">Emma Liu</p>
                                                        <p className="text-xs text-gray-500">API Developer</p>
                                                        <div className="flex items-center mt-1">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-1"></div>
                                                            <span className="text-xs text-red-600">Busy</span>
                                                        </div>
                                                    </div>
                                                    <button className="p-1 hover:bg-gray-100 rounded">
                                                        <MessageSquare className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status bar */}
                            <div className="h-6 bg-gray-50 border-t border-gray-200 flex items-center px-4 justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></div>
                                        <span className="text-xs text-gray-500">Connected</span>
                                    </div>
                                    <span className="text-xs text-gray-400">|</span>
                                    <div className="text-xs text-gray-500">4 team members online</div>
                                </div>
                                <div className="text-xs text-gray-500">Last updated: Just now</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </ContentContainer>
    );
};