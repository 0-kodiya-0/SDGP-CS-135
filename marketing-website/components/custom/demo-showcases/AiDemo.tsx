import useTypingEffect from "@/hooks/useTypingEffect";
import { motion } from "framer-motion";
import { Bot, Settings, Plus, FileText, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

const AiDemo = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const aiResponse = useTypingEffect(
        "Based on the document analysis, here are the key points and suggested actions...",
        30
    );

    useEffect(() => {
        if (analyzing) {
            const timer = setInterval(() => {
                setProgress(p => {
                    if (p >= 100) {
                        setAnalyzing(false);
                        clearInterval(timer);
                        return 100;
                    }
                    return p + 2;
                });
            }, 50);
            return () => clearInterval(timer);
        }
    }, [analyzing]);

    return (
        <div className="w-full h-[32rem] bg-background rounded-xl shadow-xl overflow-hidden border border-white/10">
            {/* Top Bar */}
            <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between">
                <div className="flex items-center gap-2">
                    <Bot size={18} className="text-blue-400" />
                    <span className="text-sm font-medium">AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg hover:bg-white/10"
                    >
                        <Settings size={16} />
                    </motion.button>
                </div>
            </div>

            <div className="flex h-[calc(100%-3rem)]">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/10 flex flex-col">
                    <div className="p-3">
                        <button
                            onClick={() => setAnalyzing(true)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            New Analysis
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-3">
                        <div className="text-xs text-muted-foreground mb-2">Recent Documents</div>
                        {['Project Report', 'Research Paper', 'Meeting Notes'].map((doc, i) => (
                            <motion.button
                                key={doc}
                                onClick={() => setSelectedFile(doc)}
                                className={`w-full p-2 text-left rounded-lg text-sm mb-1 flex items-center gap-2 ${selectedFile === doc ? 'bg-white/10' : 'hover:bg-white/5'
                                    }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <FileText size={14} />
                                {doc}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col p-6">
                    {analyzing ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 flex flex-col items-center justify-center"
                        >
                            <div className="w-full max-w-md">
                                <div className="mb-6 text-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"
                                    />
                                    <div className="text-lg font-medium mb-2">Analyzing Document</div>
                                    <div className="text-sm text-muted-foreground">Processing content and extracting insights</div>
                                </div>

                                <div className="space-y-4">
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-blue-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        {['Extracting text', 'Analyzing context', 'Generating insights'].map((step, i) => (
                                            <div
                                                key={step}
                                                className={`flex items-center gap-2 text-sm ${progress > i * 33 ? 'text-blue-400' : 'text-muted-foreground'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 ${progress > i * 33 ? 'border-blue-400 bg-blue-400/20' : 'border-muted'
                                                    }`} />
                                                {step}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-2 mb-3">
                                        <Bot size={16} className="text-blue-400" />
                                        <span className="text-sm font-medium">AI Assistant</span>
                                    </div>
                                    <div className="text-sm">{aiResponse}</div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-blue-500/20 rounded-xl p-4"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-sm font-medium">Key Insights</div>
                                        <div className="text-xs text-muted-foreground">3 items</div>
                                    </div>
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                <div className="h-2 bg-white/20 rounded-full flex-1" />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            <div className="h-32 bg-white/5 rounded-xl p-4 mt-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <MessageSquare size={16} className="text-blue-400" />
                                    <span className="text-sm font-medium">Ask a question</span>
                                </div>
                                <textarea
                                    placeholder="Ask about the document content..."
                                    className="w-full h-16 bg-transparent resize-none text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiDemo;