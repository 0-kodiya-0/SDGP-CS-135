"use client"

import React from 'react';
import { motion } from 'framer-motion';
import ContentContainer from '@/layouts/ContentContainer';
import Image from 'next/image';

const FoundationsSection: React.FC = () => {
    const fadeInVariant = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6 }
        }
    };

    return (
        <ContentContainer className='py-12 md:py-16 lg:py-24'>
            <motion.div
                variants={fadeInVariant}
                initial="hidden"
                animate="visible"
                className="text-center mb-12"
            >
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    Built on Strong Foundations
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mt-4">
                    FusionSpace combines cutting-edge technologies to deliver a seamless,
                    secure, and scalable workspace solution.
                </p>
            </motion.div>

            <motion.div
                variants={fadeInVariant}
                initial="hidden"
                animate="visible"
                className="flex justify-center items-center w-full py-8"
            >
                <div className="relative w-full max-w-6xl">
                    <Image
                        src="/cloud-computing.svg"
                        alt="Cloud computing"
                        width={1200}
                        height={300}
                        className="w-auto h-48 md:h-64 lg:h-96 xl:h-[28rem] mx-auto"
                        priority
                    />
                </div>
            </motion.div>
        </ContentContainer>
    );
};

export default FoundationsSection;