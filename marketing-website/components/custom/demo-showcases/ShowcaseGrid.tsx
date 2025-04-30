import React from 'react';
import { motion } from 'framer-motion';
import AiDemo from './AiDemo';
import CollaborationDemo from './CollaborationDemo';
import WorkspaceDemo from './WorkspaceDemo';
import features from '../feature/feature.data';
import ContentContainer from '@/layouts/ContentContainer';
import PageLayout from '@/layouts/PageLayout';

// Main Feature Grid Component
const ShowcaseGrid = () => {
    const featureRows = [
        {
            feature: features[0], // Customizable Workspaces
            visual: <WorkspaceDemo />
        },
        {
            feature: features[2], // Real-time Collaboration
            visual: <CollaborationDemo />
        },
        {
            feature: features[3], // AI-Powered Features
            visual: <AiDemo />
        }
    ];

    return (
        <PageLayout>
            <ContentContainer>
                <div className="relative">
                    {/* Grid Background Lines */}
                    <div className="absolute inset-0 grid grid-cols-2 pointer-events-none">
                        <div className="border-r border-white/10" />
                    </div>
                    <div className="absolute inset-0 grid grid-rows-3 pointer-events-none">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="border-b border-white/10" />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="relative grid gap-24 py-24">
                        {featureRows.map((row, rowIndex) => (
                            <motion.div
                                key={rowIndex}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: rowIndex * 0.2 }}
                                className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
                            >

                                <div className="relative">
                                    <div className="absolute w-4 h-4 border-2 border-blue-600/50 top-0 right-0 translate-x-1/2 -translate-y-1/2" />
                                    {row.visual}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </ContentContainer>
        </PageLayout>
    );
};

export default ShowcaseGrid;