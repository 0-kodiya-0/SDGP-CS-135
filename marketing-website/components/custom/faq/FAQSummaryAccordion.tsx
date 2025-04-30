import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import ContentContainer from '@/layouts/ContentContainer';
import { MessageCircle, Zap, Shield, Layout, Headphones } from 'lucide-react';

const faqs = [
    {
        question: "What platforms is FusionSpace available on?",
        answer: "FusionSpace is available on multiple platforms including web browsers, desktop applications (Windows, macOS, Linux), and mobile devices (iOS, Android). You can access your workspace seamlessly across all your devices.",
        icon: <Layout className="h-5 w-5" />
    },
    {
        question: "How much does FusionSpace cost?",
        answer: "FusionSpace offers flexible pricing options:\n\n• Free Tier: Basic features with limited storage\n• Pro: $9.99/month with advanced features and 100GB storage\n• Enterprise: Custom pricing for organizations with dedicated support and unlimited storage\n\nAll plans come with a 14-day free trial.",
        icon: <Zap className="h-5 w-5" />
    },
    {
        question: "Can I integrate third-party applications?",
        answer: "Yes! FusionSpace supports integration with popular tools like Google Workspace, Microsoft 365, Slack, and many more. You can connect and manage your favorite apps directly within FusionSpace's interface.",
        icon: <MessageCircle className="h-5 w-5" />
    },
    {
        question: "How secure is my data?",
        answer: "We take security seriously. FusionSpace implements end-to-end encryption, two-factor authentication, and regular security audits. Your data is stored in secure, encrypted servers with regular backups.",
        icon: <Shield className="h-5 w-5" />
    },
    {
        question: "Is there a limit on the number of environments I can create?",
        answer: "Free tier users can create up to 3 environments. Pro users can create unlimited environments, while Enterprise users get additional features like environment templates and advanced management tools.",
        icon: <Layout className="h-5 w-5" />
    },
    {
        question: "Do you offer customer support?",
        answer: "Yes, we provide multiple support channels:\n\n• 24/7 email support for all users\n• Live chat support for Pro users\n• Dedicated support manager for Enterprise customers\n• Comprehensive documentation and community forums",
        icon: <Headphones className="h-5 w-5" />
    }
];

const FAQSummaryAccordion = () => {
    return (
        <ContentContainer className="py-12 md:py-16 lg:py-24">
            <div className="relative mx-auto max-w-4xl">
                {/* Background Effects */}
                <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-accent/10 opacity-50 blur-3xl" />

                {/* Header Section */}
                <div className="relative mb-16 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                        {`Everything you need to know about FusionSpace. Can't find the answer you're looking for?  `}
                        <a href="/contact" className="text-blue-accent hover:text-blue-accent-hover">
                            Contact our support team
                        </a>
                    </p>
                </div>

                {/* FAQ Accordion */}
                <div className="relative bg-white/50 p-6 backdrop-blur-xl dark:bg-gray-900/50">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index}`}
                                className="border-b border-border-color last:border-b-0"
                            >
                                <AccordionTrigger className="group flex w-full items-center py-6 text-left">
                                    <div className="flex flex-1 items-center">
                                        <div className="mr-4 rounded-lg bg-gray-100 p-2 text-gray-500 transition-colors group-hover:bg-blue-accent/10 group-hover:text-blue-accent dark:bg-gray-800">
                                            {faq.icon}
                                        </div>
                                        <span className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-blue-accent dark:text-white">
                                            {faq.question}
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-1 pb-6">
                                    <div className="ml-11 text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                        {faq.answer}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </ContentContainer>
    );
};

export default FAQSummaryAccordion;