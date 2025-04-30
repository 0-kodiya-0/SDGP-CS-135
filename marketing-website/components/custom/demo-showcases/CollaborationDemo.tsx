import useTypingEffect from "@/hooks/useTypingEffect";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, Share, Search, Plus, MessageSquare } from "lucide-react";
import { useState } from "react";

// Advanced Collaboration Demo
const CollaborationDemo = () => {
    const [activeChat, setActiveChat] = useState('Team Alpha');
    const [showCallOverlay, setShowCallOverlay] = useState(false);
    const typedMessage = useTypingEffect("Hey team, I've updated the design files. Take a look!");

    return (
        <div className="w-full h-[32rem] bg-background rounded-xl shadow-xl overflow-hidden border border-white/10">
            {/* Top Bar */}
            <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.2 }}
                                className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 border-2 border-background flex items-center justify-center text-xs font-medium"
                            >
                                {['AB', 'CD', 'EF'][i]}
                            </motion.div>
                        ))}
                    </div>
                    <span className="text-sm font-medium">{activeChat}</span>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowCallOverlay(true)}
                        className="p-2 rounded-lg hover:bg-white/10"
                    >
                        <Phone size={16} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg hover:bg-white/10"
                    >
                        <Video size={16} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg hover:bg-white/10"
                    >
                        <Share size={16} />
                    </motion.button>
                </div>
            </div>

            <div className="flex h-[calc(100%-3rem)]">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/10 flex flex-col">
                    <div className="p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {['Team Alpha', 'Project Beta', 'Design Team'].map((chat, i) => (
                            <motion.button
                                key={chat}
                                onClick={() => setActiveChat(chat)}
                                className={`w-full p-3 flex items-center gap-3 hover:bg-white/5 ${activeChat === chat ? 'bg-white/10' : ''
                                    }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                                    {chat[0]}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-medium">{chat}</div>
                                    <div className="text-xs text-muted-foreground">Last message: 5m ago</div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-4 space-y-4 overflow-auto">
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.2 }}
                                className={`flex items-start gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-xs">
                                    {i % 2 === 0 ? 'JD' : 'ME'}
                                </div>
                                <div className={`max-w-[70%] p-3 rounded-xl ${i % 2 === 0 ? 'bg-white/10' : 'bg-blue-500/20'
                                    }`}>
                                    <div className="text-sm">
                                        {i === 2 ? typedMessage : "Example message content here"}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">12:34 PM</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-10"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10">
                                    <Plus size={16} />
                                </button>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600"
                            >
                                <MessageSquare size={18} />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call Overlay */}
            <AnimatePresence>
                {showCallOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-background/80 backdrop-blur-xl rounded-xl p-8 flex flex-col items-center"
                        >
                            <div className="flex -space-x-2 mb-6">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.2 }}
                                        className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-xl"
                                    >
                                        {['AB', 'CD', 'EF'][i]}
                                    </motion.div>
                                ))}
                            </div>
                            <div className="text-lg font-medium mb-2">Team Call</div>
                            <div className="text-sm text-muted-foreground mb-8">Connecting...</div>
                            <div className="flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowCallOverlay(false)}
                                    className="p-4 bg-red-500 rounded-full hover:bg-red-600"
                                >
                                    <Phone size={24} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-4 bg-white/10 rounded-full hover:bg-white/20"
                                >
                                    <Video size={24} />
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CollaborationDemo;