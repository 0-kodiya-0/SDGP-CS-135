"use client"

import { useTheme } from "next-themes";
import React from "react";
import Link from "next/link";
import { FooterProps } from "./footer.types";
import { Facebook, Twitter, Youtube, ArrowRight, Mail } from "lucide-react";
import ContentContainer from "@/layouts/ContentContainer";
import { footerSections } from "./routes.conf";
import Image from "next/image";
import PageLayout from "@/layouts/PageLayout";

const Footer: React.FC<FooterProps> = ({ className = "" }) => {
    const { theme } = useTheme();

    return (
        <PageLayout>
            <footer className={`relative w-full border-t border-border-color bg-background py-16 ${className}`}>
                {/* Background Gradient Effect */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -left-4 top-0 h-72 w-72 rounded-full bg-blue-accent/5 blur-3xl" />
                    <div className="absolute -right-4 bottom-0 h-72 w-72 rounded-full bg-blue-accent/5 blur-3xl" />
                </div>

                <ContentContainer className="relative">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                        {/* Navigation Sections - Expanded to fill the space */}
                        <nav className="col-span-1 grid grid-cols-1 gap-8 sm:grid-cols-3 lg:col-span-8">
                            {footerSections.map((section) => (
                                <div key={section.title} className="flex flex-col">
                                    <p className="text-sm font-semibold text-foreground">
                                        {section.title}
                                    </p>
                                    <ul className="mt-3 space-y-2">
                                        {section.links.map((link) => (
                                            <li key={link.href}>
                                                <Link
                                                    href={link.href}
                                                    className="group inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-blue-accent"
                                                >
                                                    {link.label}
                                                    <ArrowRight className="ml-1 h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </nav>

                        {/* Newsletter Section */}
                        <div className="col-span-1 lg:col-span-4">
                            <p className="text-sm font-semibold text-foreground">
                                Stay Updated
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Subscribe to our newsletter for updates and insights.
                            </p>
                            <form className="mt-4">
                                <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-2 sm:space-y-0">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            placeholder="Enter your email"
                                            className="w-full rounded-lg border border-border-color bg-white px-10 py-2 text-sm shadow-sm dark:bg-gray-900"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center justify-center rounded-lg bg-blue-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-accent-hover"
                                    >
                                        Subscribe
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Bottom Section with Logo Moved Here */}
                    <div className="mt-16 border-t border-border-color pt-8">
                        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                            {/* Logo (moved to bottom) */}
                            <Link href="/" className="inline-block order-1 md:order-1">
                                <Image
                                    src={theme === "dark" ? "/icons/logo-transparent-darkmode.png" : "/icons/logo-transparent-lightmode.png"}
                                    alt="FusionSpace Logo"
                                    width={250}
                                    height={55}
                                    className="h-20 w-auto"
                                    priority
                                    quality={100}
                                />
                            </Link>

                            {/* Social Links */}
                            <div className="flex items-center space-x-4 order-2 md:order-3">
                                <Link
                                    href="https://twitter.com"
                                    className="group rounded-full bg-gray-100 p-2.5 transition-colors hover:bg-blue-accent/10 dark:bg-gray-800"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Twitter className="h-5 w-5 text-gray-600 transition-colors group-hover:text-blue-accent dark:text-gray-400" />
                                </Link>
                                <Link
                                    href="https://facebook.com"
                                    className="group rounded-full bg-gray-100 p-2.5 transition-colors hover:bg-blue-accent/10 dark:bg-gray-800"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Facebook className="h-5 w-5 text-gray-600 transition-colors group-hover:text-blue-accent dark:text-gray-400" />
                                </Link>
                                <Link
                                    href="https://youtube.com"
                                    className="group rounded-full bg-gray-100 p-2.5 transition-colors hover:bg-blue-accent/10 dark:bg-gray-800"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Youtube className="h-5 w-5 text-gray-600 transition-colors group-hover:text-blue-accent dark:text-gray-400" />
                                </Link>
                            </div>
                        </div>

                        {/* Terms/Privacy/Cookies Links - Moved above copyright */}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                            <Link href="/terms" className="hover:text-blue-accent">Terms</Link>
                            <span>•</span>
                            <Link href="/privacy" className="hover:text-blue-accent">Privacy</Link>
                            <span>•</span>
                            <Link href="/cookies" className="hover:text-blue-accent">Cookies</Link>
                        </div>

                        {/* Copyright - Moved below links for proper centering */}
                        <p className="mt-4 text-center text-xs text-muted-foreground">
                            © {new Date().getFullYear()} FusionSpace. All rights reserved.
                        </p>
                    </div>
                </ContentContainer>
            </footer>
        </PageLayout>
    );
};

export default Footer;