import React from 'react';
import { motion } from 'framer-motion';
import ContentContainer from '@/layouts/ContentContainer';

export const CTAUseProduct: React.FC = () => {
    return (
        <ContentContainer className='py-12 md:py-16 lg:py-24'>
            <div className="max-w-3xl mx-auto text-center">
                <motion.h2
                    className="text-4xl font-bold mb-6 text-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    Ready to Transform Your Workflow?
                </motion.h2>
                <motion.p
                    className="text-xl mb-8 text-muted-foreground"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Start using FusionSpace today and experience a new level of productivity.
                    Join thousands of professionals who have already made the switch.
                </motion.p>
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <button className="bg-blue-accent text-white hover:bg-blue-accent-hover px-8 py-3 rounded-lg font-medium text-lg transition-colors shadow-sm">
                        Download Now
                    </button>
                    <button className="border border-blue-accent text-blue-accent hover:bg-blue-accent/10 px-8 py-3 rounded-lg font-medium text-lg transition-colors">
                        Try Online Demo
                    </button>
                </motion.div>
            </div>
        </ContentContainer>
    );
};