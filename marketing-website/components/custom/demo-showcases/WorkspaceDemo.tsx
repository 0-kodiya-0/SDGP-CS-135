import { motion, AnimatePresence } from "framer-motion";
import { Search, Settings, ChevronDown, Plus, FileText, Maximize2, X } from "lucide-react";
import { useState } from "react";

// Advanced Workspace Environment Demo
const WorkspaceDemo = () => {
    const [activeTab, setActiveTab] = useState('Research');
    const [showCreateModal, setShowCreateModal] = useState(false);

    return (
        <div className="w-full h-[32rem] bg-background rounded-xl shadow-xl overflow-hidden border border-white/10">
            {/* Top Navigation */}
            <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">FusionSpace</span>
                </div>
                <div className="flex items-center gap-3">
                    <Search size={16} className="text-muted-foreground" />
                    <Settings size={16} className="text-muted-foreground" />
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex h-[calc(100%-3rem)]">
                {/* Sidebar */}
                <div className="w-56 border-r border-white/10 flex flex-col">
                    {/* Environment Selector */}
                    <div className="p-3 border-b border-white/10">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <span className="text-sm">Development</span>
                            <ChevronDown size={16} />
                        </button>
                    </div>

                    {/* Environment Sections */}
                    <div className="flex-1 overflow-auto p-3 space-y-6">
                        {['Projects', 'Documents', 'Tasks', 'Team'].map((section) => (
                            <div key={section} className="space-y-2">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-xs text-muted-foreground">{section}</span>
                                    <Plus size={14} className="text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    {[1, 2].map((item) => (
                                        <div
                                            key={item}
                                            className="px-2 py-1.5 text-sm rounded hover:bg-white/5 cursor-pointer flex items-center gap-2"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                                            <span>{section} {item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    {/* Tabs */}
                    <div className="h-12 border-b border-white/10 flex items-center px-4 gap-1">
                        {['Research', 'Development', 'Notes'].map((tab) => (
                            <motion.button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm ${activeTab === tab ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/5'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {tab}
                            </motion.button>
                        ))}
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="ml-2 p-1.5 rounded-lg hover:bg-white/5"
                        >
                            <Plus size={16} />
                        </motion.button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 overflow-auto">
                        <div className="grid grid-cols-2 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-blue-400" />
                                            <span className="text-sm font-medium">Project {i + 1}</span>
                                        </div>
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10"
                                        >
                                            <Maximize2 size={14} />
                                        </motion.button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 bg-white/10 rounded-full w-3/4" />
                                        <div className="h-2 bg-white/10 rounded-full w-1/2" />
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {[...Array(3)].map((_, j) => (
                                                <div
                                                    key={j}
                                                    className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 border-2 border-background"
                                                />
                                            ))}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Updated 2h ago</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Environment Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-background rounded-xl p-6 w-96 shadow-xl border border-white/10"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Create Environment</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-1 rounded-lg hover:bg-white/10"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-2">Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2"
                                        placeholder="Enter environment name"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-2">Type</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                        <option>Development</option>
                                        <option>Research</option>
                                        <option>Personal</option>
                                    </select>
                                </div>
                                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 transition-colors">
                                    Create Environment
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorkspaceDemo;